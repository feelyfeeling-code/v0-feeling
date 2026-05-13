import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HomeDashboard } from '@/components/home/home-dashboard'
import { checkDailyAnalysisLimit, DAILY_ANALYSIS_LIMIT } from '@/lib/rate-limit'

export const metadata = {
  title: 'Accueil - Feeling',
  description: 'Analyse tes offres d\'emploi et trouve le job qui te correspond',
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/connexion')
  }
  
  // Check if onboarding is completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, first_name')
    .eq('id', user.id)
    .single()
  
  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }
  
  // Get user's previous analyses + daily count + technical profile state.
  // hasTechnicalProfile sert à savoir si l'analyse rapide intégrera déjà les
  // hard skills (et donc à rediriger directement vers /resultats-complets).
  const [analysesResult, { count: dailyCount }, skillsResult, experienceResult] =
    await Promise.all([
      supabase
        .from('job_analyses')
        .select(
          'id, job_title, company_name, personality_score, values_score, skills_score, has_dealbreakers, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      checkDailyAnalysisLimit(supabase, user.id),
      supabase
        .from('technical_skills')
        .select('skills')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('work_experiences')
        .select('id')
        .eq('user_id', user.id)
        .limit(1),
    ])

  const hasTechnicalProfile =
    (skillsResult.data?.skills?.length ?? 0) > 0 ||
    (experienceResult.data?.length ?? 0) > 0

  const firstName = profile?.first_name || user.user_metadata?.first_name || 'toi'

  return (
    <HomeDashboard
      userId={user.id}
      firstName={firstName}
      recentAnalyses={analysesResult.data || []}
      dailyAnalysisCount={dailyCount}
      dailyAnalysisLimit={DAILY_ANALYSIS_LIMIT}
      hasTechnicalProfile={hasTechnicalProfile}
    />
  )
}
