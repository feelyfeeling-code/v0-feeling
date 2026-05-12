import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CompleteResultsView } from '@/components/results/complete-results-view'

export const metadata = {
  title: 'Résultats complets - Feeling',
  description: 'Ton analyse complète de compatibilité avec cette offre',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function CompleteResultsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  const [analysisResult, skillsResult, experienceResult] = await Promise.all([
    supabase
      .from('job_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
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

  if (analysisResult.error || !analysisResult.data) {
    notFound()
  }

  const hasTechnicalProfile =
    (skillsResult.data?.skills?.length ?? 0) > 0 ||
    (experienceResult.data?.length ?? 0) > 0

  return (
    <CompleteResultsView
      analysis={analysisResult.data}
      userId={user.id}
      hasTechnicalProfile={hasTechnicalProfile}
    />
  )
}
