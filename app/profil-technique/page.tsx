import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TechnicalProfileForm } from '@/components/profile/technical-profile-form'

export const metadata = {
  title: 'Profil technique - Feeling',
  description: 'Ajoute tes expériences et compétences techniques',
}

interface Props {
  searchParams: Promise<{ from?: string }>
}

export default async function ProfilTechniquePage({ searchParams }: Props) {
  const { from: fromAnalysisId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  // Load existing technical profile if any
  const [skillsResult, experiencesResult] = await Promise.all([
    supabase.from('technical_skills').select('skills').eq('user_id', user.id).single(),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false }),
  ])

  return (
    <TechnicalProfileForm
      userId={user.id}
      fromAnalysisId={fromAnalysisId}
      initialSkills={skillsResult.data?.skills ?? []}
      initialExperiences={experiencesResult.data ?? []}
    />
  )
}
