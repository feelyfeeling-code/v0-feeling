import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeJobOffer, type JobData } from '@/lib/scraper'
import { analyzeJobMatch } from '@/lib/ai-analysis'
import { checkDailyAnalysisLimit, DAILY_ANALYSIS_LIMIT } from '@/lib/rate-limit'

interface RawOfferPayload {
  title: string
  company: string
  description: string
  location?: string
  type?: string
  remote?: string
  url?: string
}

export async function POST(request: Request) {
  try {
    const { url, rawOffer, userId } = (await request.json()) as {
      url?: string
      rawOffer?: RawOfferPayload
      userId?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    if (!url && !rawOffer) {
      return NextResponse.json(
        { error: 'URL ou contenu d\'offre requis' },
        { status: 400 },
      )
    }
    
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Check daily analysis limit
    const { exceeded, count } = await checkDailyAnalysisLimit(supabase, userId)
    if (exceeded) {
      return NextResponse.json(
        {
          error: `Tu as atteint la limite de ${DAILY_ANALYSIS_LIMIT} analyses par jour. Reviens demain !`,
          code: 'DAILY_LIMIT_EXCEEDED',
          count,
          limit: DAILY_ANALYSIS_LIMIT,
        },
        { status: 429 },
      )
    }

    // Get user profiles for analysis
    const [personalityResult, valuesResult, dreamJobResult, situationResult] = await Promise.all([
      supabase.from('personality_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('values_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('dream_jobs').select('*').eq('user_id', userId).single(),
      supabase.from('current_situations').select('situations, job_search_types').eq('user_id', userId).single(),
    ])
    
    if (!personalityResult.data || !valuesResult.data) {
      return NextResponse.json(
        { error: 'Profil incomplet. Complète ton onboarding.' },
        { status: 400 }
      )
    }
    
    // Get job data : either by scraping URL, or from manually pasted offer
    let jobData: JobData
    if (rawOffer) {
      if (!rawOffer.description?.trim()) {
        return NextResponse.json(
          { error: 'Le texte de l\'offre est requis' },
          { status: 400 },
        )
      }
      jobData = {
        title: rawOffer.title?.trim() || 'Poste non spécifié',
        company: rawOffer.company?.trim() || 'Entreprise non spécifiée',
        description: rawOffer.description,
        location: rawOffer.location?.trim() || 'Non spécifié',
        type: rawOffer.type?.trim() || 'Non spécifié',
        remote: rawOffer.remote?.trim() || 'Non spécifié',
      }
    } else {
      try {
        jobData = await scrapeJobOffer(url!)
      } catch (scrapeError) {
        console.error('Scraping error:', scrapeError)
        return NextResponse.json(
          {
            error:
              'Impossible de récupérer l\'offre automatiquement. Copie-colle directement le texte de l\'offre dans le champ prévu.',
            code: 'SCRAPE_FAILED',
          },
          { status: 400 },
        )
      }
    }
    
    // Analyze job match with AI
    const analysis = await analyzeJobMatch({
      jobData,
      personality: personalityResult.data,
      values: valuesResult.data,
      dreamJob: dreamJobResult.data,
      currentSituation: situationResult.data,
    })
    
    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('job_analyses')
      .insert({
        user_id: userId,
        job_url: url ?? rawOffer?.url ?? '',
        job_title: jobData.title,
        company_name: jobData.company,
        job_description: jobData.description,
        job_location: jobData.location,
        job_type: jobData.type,
        job_remote: jobData.remote,
        overall_score: analysis.overallScore,
        personality_score: analysis.personalityScore,
        values_score: analysis.valuesScore,
        skills_score: analysis.skillsScore,
        personality_analysis: analysis.personalityAnalysis,
        values_analysis: analysis.valuesAnalysis,
        skills_analysis: analysis.skillsAnalysis,
        strengths: analysis.strengths,
        attention_points: analysis.attentionPoints,
        has_dealbreakers: analysis.hasDealbreakers,
        dealbreaker_details: analysis.dealbreakerDetails,
      })
      .select()
      .single()
    
    if (saveError) {
      console.error('Save error:', saveError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      analysisId: savedAnalysis.id,
      success: true 
    })
    
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    console.error('Analysis error:', message, error)
    return NextResponse.json(
      { error: `Erreur lors de l'analyse : ${message}` },
      { status: 500 }
    )
  }
}
