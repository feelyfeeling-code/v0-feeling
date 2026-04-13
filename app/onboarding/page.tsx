import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata = {
  title: 'Onboarding - Feeling',
  description: 'Fais connaissance avec Feely pour qu\'il puisse t\'aider',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/connexion')
  }
  
  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()
  
  if (profile?.onboarding_completed) {
    redirect('/accueil')
  }
  
  // Get user's first name from metadata
  const firstName = user.user_metadata?.first_name || 'toi'
  
  return <OnboardingFlow userId={user.id} firstName={firstName} />
}
