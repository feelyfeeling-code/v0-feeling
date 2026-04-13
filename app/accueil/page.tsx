import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HomeDashboard } from '@/components/home/home-dashboard'

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
  
  // Get user's previous analyses
  const { data: analyses } = await supabase
    .from('job_analyses')
    .select('id, job_title, company_name, overall_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  const firstName = profile?.first_name || user.user_metadata?.first_name || 'toi'
  
  return (
    <HomeDashboard 
      userId={user.id}
      firstName={firstName}
      recentAnalyses={analyses || []}
    />
  )
}
