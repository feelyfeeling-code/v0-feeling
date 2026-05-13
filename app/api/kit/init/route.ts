import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildCV } from '@/lib/kit/cv-builder'
import { enrichCVWithAI } from '@/lib/kit/ai-cv-enricher'

export async function POST(request: Request) {
  try {
    const { analysisId } = await request.json()
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = user.id

    const { data: analysis, error: analysisError } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()
    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })
    }

    const { data: existingKit } = await supabase
      .from('application_kits')
      .select('cv_data, cover_letter')
      .eq('user_id', userId)
      .eq('analysis_id', analysisId)
      .maybeSingle()

    // Un kit est "nouveau format" s'il a softSkills. Sinon, on régénère.
    const cvData = existingKit?.cv_data as Record<string, unknown> | undefined
    const isEnriched = cvData && Array.isArray(cvData.softSkills)
    if (existingKit && existingKit.cv_data && isEnriched) {
      return NextResponse.json({
        cv: existingKit.cv_data,
        coverLetter: existingKit.cover_letter ?? '',
        analysis: {
          id: analysis.id,
          jobTitle: analysis.job_title,
          companyName: analysis.company_name,
        },
      })
    }

    const [
      profileResult,
      academicResult,
      experiencesResult,
      skillsResult,
      valuesResult,
      personalityResult,
      dreamJobResult,
      currentSituationResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single(),
      supabase
        .from('academic_profiles')
        .select('education_level, graduation_date, diploma_name, school_name, field_of_study')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('work_experiences')
        .select('job_title, company_name, location, start_date, end_date, is_current, main_tasks')
        .eq('user_id', userId)
        .order('start_date', { ascending: false }),
      supabase
        .from('technical_skills')
        .select('skills')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('values_profiles')
        .select('selected_values, dealbreakers')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('personality_profiles')
        .select('traits, has_taken_test, test_type, test_result')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('dream_jobs')
        .select('job_titles, locations, industries, remote_preference, salary_range')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('current_situations')
        .select('situations, job_search_types')
        .eq('user_id', userId)
        .maybeSingle(),
    ])

    if (!profileResult.data) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 400 })
    }

    const rawSkills = skillsResult.data?.skills ?? []
    const rawExperiences = experiencesResult.data ?? []

    const baseCv = buildCV({
      profile: profileResult.data,
      academic: academicResult.data ?? null,
      experiences: rawExperiences,
      skills: rawSkills,
      values: valuesResult.data?.selected_values ?? [],
      dreamJob: dreamJobResult.data ?? null,
      job: {
        title: analysis.job_title,
        description: analysis.job_description,
        location: analysis.job_location,
      },
    })

    const enrichedCv = await enrichCVWithAI({
      cv: baseCv,
      personality: personalityResult.data ?? null,
      valuesRaw: valuesResult.data ?? null,
      dreamJob: dreamJobResult.data ?? null,
      currentSituation: currentSituationResult.data ?? null,
      experiencesRaw: rawExperiences,
      skillsRaw: rawSkills,
      job: {
        title: analysis.job_title,
        company: analysis.company_name,
        description: analysis.job_description,
        location: analysis.job_location,
        remote: analysis.job_remote,
        industry: analysis.job_industry ?? null,
      },
      analysisScores: {
        overall: analysis.overall_score ?? null,
        personality: analysis.personality_score ?? null,
        values: analysis.values_score ?? null,
        skills: analysis.skills_score ?? null,
      },
      analysisInsights: {
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        personalityFit: Array.isArray(analysis.personality_analysis?.strengths)
          ? analysis.personality_analysis.strengths
          : [],
        valuesFit: Array.isArray(analysis.values_analysis?.strengths)
          ? analysis.values_analysis.strengths
          : [],
      },
    })

    const { error: upsertError } = await supabase.from('application_kits').upsert(
      {
        user_id: userId,
        analysis_id: analysisId,
        cv_data: enrichedCv,
        cover_letter: existingKit?.cover_letter ?? null,
      },
      { onConflict: 'user_id,analysis_id' },
    )

    if (upsertError) {
      console.error('[kit/init] upsert error', upsertError)
      return NextResponse.json(
        { error: `Erreur sauvegarde : ${upsertError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      cv: enrichedCv,
      coverLetter: existingKit?.cover_letter ?? '',
      analysis: {
        id: analysis.id,
        jobTitle: analysis.job_title,
        companyName: analysis.company_name,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[kit/init] error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
