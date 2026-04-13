import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Connexion - Feeling',
  description: 'Connecte-toi à ton compte Feeling',
}

export default async function ConnexionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/accueil')
  }
  
  return <LoginForm />
}
