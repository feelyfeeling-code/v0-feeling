import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { NextResponse } from 'next/server'

// GET : détail d'une demande de coaching (+ diplômé + conseillers de l'école)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  const { data: req, error } = await supabase
    .from('coaching_requests')
    .select('*, school_advisors ( id, full_name )')
    .eq('id', id)
    .eq('school_id', advisor.schoolId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!req) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  const [profileRes, memberRes, academicRes, advisorsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', req.user_id)
      .maybeSingle(),
    supabase
      .from('school_members')
      .select('program, graduation_year, status')
      .eq('user_id', req.user_id)
      .maybeSingle(),
    supabase
      .from('academic_profiles')
      .select('diploma_name')
      .eq('user_id', req.user_id)
      .maybeSingle(),
    supabase
      .from('school_advisors')
      .select('id, full_name, role')
      .eq('school_id', advisor.schoolId),
  ])

  const p = profileRes.data
  const graduateName =
    [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || p?.email || 'Diplômé'

  return NextResponse.json({
    request: req,
    graduate: {
      user_id: req.user_id,
      full_name: graduateName,
      email: p?.email ?? null,
      program: memberRes.data?.program || academicRes.data?.diploma_name || null,
      status: memberRes.data?.status ?? null,
    },
    advisors: advisorsRes.data ?? [],
  })
}
