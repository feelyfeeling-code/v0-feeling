import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SchoolNav } from '@/components/school/school-nav'

export const metadata = {
  title: 'Espace École - Feeling',
  description: 'Suivi de l\'insertion professionnelle de vos diplômés',
}

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  const { data: advisor } = await supabase
    .from('school_advisors')
    .select('full_name, school_id, schools ( name )')
    .eq('user_id', user.id)
    .maybeSingle()

  // Accès réservé aux conseillers : un diplômé est renvoyé vers son espace
  if (!advisor) {
    redirect('/dashboard')
  }

  const schoolName =
    (advisor.schools as { name?: string } | null)?.name ?? 'Votre école'

  return (
    <div className="min-h-screen bg-muted/30">
      <SchoolNav schoolName={schoolName} advisorName={advisor.full_name} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
