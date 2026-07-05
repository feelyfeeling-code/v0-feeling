import type { SupabaseClient } from '@supabase/supabase-js'

export interface FeelyContext {
  days_since_last_application: number | null
  average_score: number | null
  analyses_without_application: number
  applications_this_week: number
  days_active_searching: number | null
  dream_job_titles: string[]
  main_values: string[]
  generated_at: string
}

/**
 * Construit le contexte "Feely" à partir des données réelles du diplômé :
 * activité de candidature, scores d'adéquation, job de rêve et valeurs.
 * Réutilisé côté diplômé (affichage + POST) et côté école (fiche demande).
 */
export async function buildFeelyContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<FeelyContext> {
  const [analysesRes, applicationsRes, memberRes, dreamRes, valuesRes] = await Promise.all([
    supabase
      .from('job_analyses')
      .select('id, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('applications')
      .select('id, analysis_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('school_members')
      .select('created_at, status')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('dream_jobs').select('job_titles').eq('user_id', userId).maybeSingle(),
    supabase.from('values_profiles').select('selected_values').eq('user_id', userId).maybeSingle(),
  ])

  const analyses = analysesRes.data ?? []
  const applications = applicationsRes.data ?? []

  // Jours depuis la dernière candidature
  let daysSinceLastApplication: number | null = null
  if (applications.length > 0) {
    const last = new Date(applications[0].created_at).getTime()
    daysSinceLastApplication = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24))
  }

  // Score moyen des 3 dernières analyses
  let averageScore: number | null = null
  const recentScores = analyses
    .slice(0, 3)
    .map((a) => a.overall_score)
    .filter((s): s is number => typeof s === 'number')
  if (recentScores.length > 0) {
    averageScore = Math.round(recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length)
  }

  // Offres analysées sans candidature envoyée
  const appliedAnalysisIds = new Set(
    applications.map((a) => a.analysis_id).filter((id): id is string => Boolean(id)),
  )
  const analysesWithoutApplication = analyses.filter((a) => !appliedAnalysisIds.has(a.id)).length

  // Candidatures cette semaine (7 derniers jours)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const applicationsThisWeek = applications.filter(
    (a) => new Date(a.created_at).getTime() >= weekAgo,
  ).length

  // Jours en recherche active (depuis le rattachement école si en recherche)
  let daysActiveSearching: number | null = null
  if (memberRes.data?.created_at && memberRes.data?.status === 'searching') {
    const start = new Date(memberRes.data.created_at).getTime()
    daysActiveSearching = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24))
  }

  return {
    days_since_last_application: daysSinceLastApplication,
    average_score: averageScore,
    analyses_without_application: analysesWithoutApplication,
    applications_this_week: applicationsThisWeek,
    days_active_searching: daysActiveSearching,
    dream_job_titles: dreamRes.data?.job_titles ?? [],
    main_values: valuesRes.data?.selected_values ?? [],
    generated_at: new Date().toISOString(),
  }
}
