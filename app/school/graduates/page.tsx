import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { getSchoolGraduates, getSchoolPrograms } from '@/lib/school/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GraduatesFilters } from '@/components/school/graduates-filters'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_STYLES,
  timeAgo,
  isInactiveAlert,
} from '@/lib/school/labels'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Diplômés - Espace École' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function GraduatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; program?: string; search?: string; coaching?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)
  if (!advisor) redirect('/dashboard')

  const [graduates, programs] = await Promise.all([
    getSchoolGraduates(supabase, advisor.schoolId, {
      status: params.status,
      program: params.program,
      search: params.search,
      coaching: params.coaching,
    }),
    getSchoolPrograms(supabase, advisor.schoolId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-balance">Diplômés</h1>
        <p className="text-muted-foreground mt-1">
          {graduates.length} diplômé{graduates.length > 1 ? 's' : ''} suivi
          {graduates.length > 1 ? 's' : ''}
        </p>
      </div>

      <GraduatesFilters programs={programs} />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead>Obtention</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coaching</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graduates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucun diplômé ne correspond à ces critères.
                  </TableCell>
                </TableRow>
              )}
              {graduates.map((g) => {
                const alert = isInactiveAlert(g.last_active_at, g.status)
                return (
                  <TableRow key={g.user_id}>
                    <TableCell>
                      <Link
                        href={`/school/graduates/${g.user_id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        {alert && (
                          <span
                            className="w-2 h-2 rounded-full bg-destructive shrink-0"
                            title="Inactif depuis +21 jours"
                            aria-label="Inactif depuis plus de 21 jours"
                          />
                        )}
                        {g.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{g.program ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(g.graduation_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(g.last_active_at)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                          MEMBER_STATUS_STYLES[g.status] ?? 'bg-muted text-muted-foreground',
                        )}
                      >
                        {MEMBER_STATUS_LABELS[g.status] ?? g.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {g.pending_coaching > 0 ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-warning/40 text-warning-foreground">
                          À traiter
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
