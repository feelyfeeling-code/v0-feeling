import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { KitCandidatureView } from '@/components/kit/kit-candidature-view'
import { migrateLegacySkills, type CVData } from '@/lib/kit/cv-builder'

export const metadata = {
  title: 'Kit de candidature - Feeling',
  description: 'Génère ton CV et ta lettre de motivation adaptés à l\'offre',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function KitCandidaturePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/connexion')
  }

  const [analysisResult, kitResult, profileResult] = await Promise.all([
    supabase
      .from('job_analyses')
      .select('id, job_title, company_name, job_location')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('application_kits')
      .select('cv_data, cover_letter')
      .eq('user_id', user.id)
      .eq('analysis_id', id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single(),
  ])

  if (analysisResult.error || !analysisResult.data) {
    notFound()
  }

  const candidateFullName =
    [profileResult.data?.first_name, profileResult.data?.last_name].filter(Boolean).join(' ').trim() ||
    'Candidat·e'

  // Adapte un CV sauvegardé au nouveau schéma : `skills` est désormais
  // un tableau de domaines, et `interests` est un nouveau champ. Cela évite
  // de casser l'affichage des kits générés avant la refonte.
  const initialCv: CVData | null = kitResult.data?.cv_data
    ? (() => {
        const raw = kitResult.data!.cv_data as Record<string, unknown>
        return {
          ...(raw as unknown as CVData),
          skills: migrateLegacySkills(raw.skills),
          interests: Array.isArray(raw.interests) ? (raw.interests as string[]) : [],
          languages: Array.isArray(raw.languages) ? (raw.languages as string[]) : [],
        }
      })()
    : null

  return (
    <KitCandidatureView
      analysis={{
        id: analysisResult.data.id,
        jobTitle: analysisResult.data.job_title,
        companyName: analysisResult.data.company_name,
        jobLocation: analysisResult.data.job_location,
      }}
      candidate={{
        fullName: candidateFullName,
        email: profileResult.data?.email ?? null,
      }}
      initialCv={initialCv}
      initialCoverLetter={kitResult.data?.cover_letter ?? ''}
    />
  )
}
