import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ResultsView } from '@/components/results/results-view'

export const metadata = {
  title: 'Résultats - Feeling',
  description: 'Découvre ton feeling avec cette offre',
}

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/connexion')
  }
  
  // Get analysis data
  const { data: analysis, error } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (error || !analysis) {
    notFound()
  }
  
  // Check if user has technical profile
  const { data: technicalSkills } = await supabase
    .from('technical_skills')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
  
  const hasTechnicalProfile = technicalSkills && technicalSkills.length > 0
  
  return (
    <ResultsView
      analysis={analysis}
      hasTechnicalProfile={hasTechnicalProfile}
      userId={user.id}
    />
  )
}
