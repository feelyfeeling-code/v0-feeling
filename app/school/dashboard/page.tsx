import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ExportMenu } from '@/components/school/export-menu'
import { Users, Briefcase, Search, GraduationCap, AlertTriangle, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Tableau de bord - Espace École' }

export default async function SchoolDashboardPage() {
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)
  if (!advisor) redirect('/dashboard')

  const { data: stats } = await supabase
    .from('school_dashboard_stats')
    .select('*')
    .eq('school_id', advisor.schoolId)
    .maybeSingle()

  const { data: members } = await supabase
    .from('school_members')
    .select('status, created_at, last_active_at')
    .eq('school_id', advisor.schoolId)

  const s = stats ?? {
    total_graduates: 0,
    employed: 0,
    searching: 0,
    in_studies: 0,
    on_break: 0,
    inactive_alert: 0,
    pending_requests: 0,
  }

  // Taux d'insertion
  const now = Date.now()
  const monthsAgo = (m: number) => now - m * 30 * 24 * 60 * 60 * 1000
  const insertionRate = (sinceMs: number) => {
    const cohort = (members ?? []).filter((m) => new Date(m.created_at).getTime() <= sinceMs)
    if (cohort.length === 0) return null
    const employed = cohort.filter((m) => m.status === 'employed').length
    return Math.round((employed / cohort.length) * 100)
  }
  const total = members?.length ?? 0
  const responded = (members ?? []).filter((m) => Boolean(m.last_active_at)).length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : null

  const at6 = insertionRate(monthsAgo(6))
  const at18 = insertionRate(monthsAgo(18))

  const metrics = [
    { label: 'Diplômés suivis', value: s.total_graduates, icon: Users, tint: 'bg-primary/15' },
    { label: 'En emploi', value: s.employed, icon: Briefcase, tint: 'bg-accent/25' },
    { label: 'En recherche', value: s.searching, icon: Search, tint: 'bg-info/20' },
    { label: "En études", value: s.in_studies, icon: GraduationCap, tint: 'bg-secondary/40' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-balance">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de l'insertion de vos diplômés
          </p>
        </div>
        <ExportMenu />
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.tint}`}>
              <m.icon className="w-5 h-5 text-foreground" />
            </div>
            <p className="mt-4 text-3xl font-bold">{m.value}</p>
            <p className="text-sm text-muted-foreground">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Alerte inactifs + demandes à traiter */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border-2 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-3xl font-bold text-destructive">{s.inactive_alert}</p>
              <p className="text-sm font-medium">Diplômés inactifs +21 jours</p>
              <p className="text-xs text-muted-foreground mt-1">
                En recherche mais sans activité récente
              </p>
            </div>
          </div>
        </Card>

        <Link href="/school/coaching" className="group">
          <Card className="p-5 h-full transition-colors group-hover:border-primary">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{s.pending_requests}</p>
                <p className="text-sm font-medium">Demandes à traiter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demandes de coaching en attente
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Taux d'insertion */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Taux d'insertion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RateCard label="À 6 mois" value={at6} />
          <RateCard label="À 18 mois" value={at18} />
          <RateCard label="Taux de réponse" value={responseRate} />
        </div>
      </div>
    </div>
  )
}

function RateCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold">
        {value != null ? `${value}%` : '—'}
      </p>
    </Card>
  )
}
