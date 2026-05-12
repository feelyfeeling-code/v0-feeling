import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/profile/profile-page'

export const metadata = {
  title: 'Mon profil - Feeling',
  description: 'Consulte et modifie les informations de ton profil',
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const [
    profileResult,
    situationResult,
    academicResult,
    personalityResult,
    valuesResult,
    dreamJobResult,
    skillsResult,
    experiencesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, email').eq('id', user.id).single(),
    supabase.from('current_situations').select('*').eq('user_id', user.id).single(),
    supabase.from('academic_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('personality_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('values_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('dream_jobs').select('*').eq('user_id', user.id).single(),
    supabase.from('technical_skills').select('skills').eq('user_id', user.id).single(),
    supabase.from('work_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
  ])

  return (
    <ProfilePage
      userId={user.id}
      profile={profileResult.data}
      situation={situationResult.data}
      academic={academicResult.data}
      personality={personalityResult.data}
      values={valuesResult.data}
      dreamJob={dreamJobResult.data}
      skills={skillsResult.data?.skills ?? []}
      experiences={experiencesResult.data ?? []}
    />
  )
}
