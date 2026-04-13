import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { analyzeJobMatch } from '@/lib/ai-analysis'
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

    // Fetch all user profiles
    const [personalityResult, valuesResult, dreamJobResult, situationResult, skillsResult, experiencesResult] =
      await Promise.all([
        supabase.from('personality_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('values_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('dream_jobs').select('*').eq('user_id', userId).single(),
        supabase.from('current_situations').select('situations, job_search_types').eq('user_id', userId).single(),
        supabase.from('technical_skills').select('*').eq('user_id', userId).single(),
        supabase.from('work_experiences').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
      ])

    if (!personalityResult.data || !valuesResult.data) {
      return NextResponse.json({ error: 'Profil incomplet' }, { status: 400 })
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

    // Run complete analysis with technical profile
    const analysis = await analyzeJobMatch({
      jobData,
      personality: personalityResult.data,
      values: valuesResult.data,
      dreamJob: dreamJobResult.data ?? null,
      currentSituation: situationResult.data ?? null,
      technicalProfile:
        skillsResult.data
          ? {
              skills: skillsResult.data.skills ?? [],
              experiences: experiencesResult.data ?? [],
            }
          : null,
    })

    // Update the analysis record with skills data
    const { error: updateError } = await supabase
      .from('job_analyses')
      .update({
        skills_score: analysis.skillsScore,
        skills_analysis: analysis.skillsAnalysis,
        overall_score: analysis.overallScore,
        personality_score: analysis.personalityScore,
        values_score: analysis.valuesScore,
        personality_analysis: analysis.personalityAnalysis,
        values_analysis: analysis.valuesAnalysis,
        strengths: analysis.strengths,
        attention_points: analysis.attentionPoints,
        has_dealbreakers: analysis.hasDealbreakers,
        dealbreaker_details: analysis.dealbreakerDetails,
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
