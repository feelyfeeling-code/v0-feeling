import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { analyzeSkillsOnly } from '@/lib/ai-analysis'
import type { JobData } from '@/lib/scraper'

export async function POST(request: Request) {
  try {
    const { analysisId, userId } = await request.json()

    if (!analysisId || !userId) {
      return NextResponse.json({ error: 'analysisId et userId requis' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Fetch existing analysis
    const { data: existingAnalysis, error: analysisError } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()

    if (analysisError || !existingAnalysis) {
      console.error('[analyze-complete] analysis not found', {
        analysisId,
        userId,
        authUid: user.id,
        errorMessage: analysisError?.message,
        errorCode: analysisError?.code,
        errorDetails: analysisError?.details,
      })
      return NextResponse.json(
        {
          error: `Analyse introuvable (id=${analysisId}). ${analysisError?.message ?? ''}`.trim(),
        },
        { status: 404 },
      )
    }

    // Fetch only what's needed for skills analysis
    const [skillsResult, experiencesResult, academicResult] =
      await Promise.all([
        supabase.from('technical_skills').select('*').eq('user_id', userId).single(),
        supabase.from('work_experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
        supabase.from('academic_profiles').select('education_level, graduation_date, diploma_name, school_name, field_of_study').eq('user_id', userId).single(),
      ])

    if (!skillsResult.data) {
      return NextResponse.json({ error: 'Profil technique introuvable' }, { status: 400 })
    }

    // Reconstruct JobData from stored analysis
    const jobData: JobData = {
      title: existingAnalysis.job_title,
      company: existingAnalysis.company_name,
      description: existingAnalysis.job_description ?? '',
      location: existingAnalysis.job_location ?? '',
      type: existingAnalysis.job_type ?? '',
      remote: existingAnalysis.job_remote ?? '',
    }

    // Run skills-only analysis — personality & values scores are kept from the quick analysis
    const skillsResult2 = await analyzeSkillsOnly({
      jobData,
      technicalProfile: {
        skills: skillsResult.data.skills ?? [],
        experiences: experiencesResult.data ?? [],
      },
      academicProfile: academicResult.data ?? null,
    })

    // Recalculate overallScore in code using existing personality/values scores
    const personalityScore = existingAnalysis.personality_score ?? 0
    const valuesScore = existingAnalysis.values_score ?? 0
    const skillsScore = skillsResult2.skillsScore

    let overallScore = Math.round(
      personalityScore * 0.35 +
      valuesScore      * 0.35 +
      skillsScore      * 0.30
    )

    // Re-apply dealbreaker cap if needed
    if (existingAnalysis.has_dealbreakers && overallScore > 30) {
      overallScore = 30
    }

    // Update only skills + recalculated overall (personality/values scores unchanged)
    const { error: updateError } = await supabase
      .from('job_analyses')
      .update({
        skills_score: skillsScore,
        skills_analysis: skillsResult2.skillsAnalysis,
        overall_score: overallScore,
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('[analyze-complete] update failed', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      })
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour : ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, analysisId })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[analyze-complete] unexpected error:', message, error)
    return NextResponse.json(
      { error: `Erreur lors de l'analyse complète : ${message}` },
      { status: 500 }
    )
  }
}
