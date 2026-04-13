import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Inscription - Feeling',
  description: 'Crée ton compte Feeling et trouve un job qui te ressemble',
}

export default async function InscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/accueil')
  }
  
  return <SignupForm />
}
