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

  const { data: analysis, error } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !analysis) {
    notFound()
  }

  return <CompleteResultsView analysis={analysis} />
}
