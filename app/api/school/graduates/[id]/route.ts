import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { NextResponse } from 'next/server'

// GET : profil complet d'un diplômé pour la fiche école
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: gradId } = await params
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  // Vérifie que le diplômé appartient bien à l'école du conseiller
  const { data: member } = await supabase
    .from('school_members')
    .select('user_id, status, program, graduation_year, last_active_at, created_at')
    .eq('user_id', gradId)
    .eq('school_id', advisor.schoolId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Diplômé introuvable' }, { status: 404 })
  }

  const [
    profileRes,
    academicRes,
    experiencesRes,
    skillsRes,
    personalityRes,
    valuesRes,
    dreamRes,
    applicationsRes,
    coachingRes,
    analysesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', gradId).maybeSingle(),
    supabase.from('academic_profiles').select('*').eq('user_id', gradId).maybeSingle(),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', gradId)
      .order('start_date', { ascending: false }),
    supabase.from('technical_skills').select('skills').eq('user_id', gradId).maybeSingle(),
    supabase.from('personality_profiles').select('*').eq('user_id', gradId).maybeSingle(),
    supabase.from('values_profiles').select('*').eq('user_id', gradId).maybeSingle(),
    supabase.from('dream_jobs').select('*').eq('user_id', gradId).maybeSingle(),
    supabase
      .from('applications')
      .select('*')
      .eq('user_id', gradId)
      .order('created_at', { ascending: false }),
    supabase
      .from('coaching_requests')
      .select('*, school_advisors ( full_name )')
      .eq('user_id', gradId)
      .eq('school_id', advisor.schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('job_analyses')
      .select('id, job_title, company_name, overall_score, created_at')
      .eq('user_id', gradId)
      .order('created_at', { ascending: false }),
  ])

  const applications = applicationsRes.data ?? []
  const analyses = analysesRes.data ?? []
  const scores = analyses
    .map((a) => a.overall_score)
    .filter((s): s is number => typeof s === 'number')

  const activity = {
    last_active_at: member.last_active_at,
    application_count: applications.length,
    interview_count: applications.filter((a) => a.status === 'interview').length,
    average_score:
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : null,
  }

  return NextResponse.json({
    member,
    profile: profileRes.data,
    academic: academicRes.data,
    experiences: experiencesRes.data ?? [],
    skills: skillsRes.data?.skills ?? [],
    personality: personalityRes.data,
    values: valuesRes.data,
    dream_job: dreamRes.data,
    applications,
    coaching_requests: coachingRes.data ?? [],
    analyses,
    activity,
  })
}
