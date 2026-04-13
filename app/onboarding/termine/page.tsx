import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingTermineView } from '@/components/onboarding/onboarding-termine-view'

export const metadata = {
  title: 'Onboarding terminé - Feeling',
  description: 'Feely a bien reçu tes réponses',
}

// La route est déjà protégée par le middleware (pattern /onboarding/*).
// On ne vérifie PAS onboarding_completed ici : cette page est affichée juste
// après le save, et lire profile.onboarding_completed peut renvoyer un état
// stale à cause des caches de server components, ce qui ferait un redirect
// parasite vers /onboarding. L'accès est seulement borné par l'auth.
export default async function OnboardingTerminePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  return <OnboardingTermineView />
}
