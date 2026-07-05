import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
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
import { CoachingFilters } from '@/components/school/coaching-filters'
import {
  COACHING_TYPE_LABELS,
  COACHING_STATUS_LABELS,
  COACHING_STATUS_STYLES,
  timeAgo,
  hoursSince,
} from '@/lib/school/labels'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Coaching - Espace École' }

export default async function CoachingListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; advisor_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)
  if (!advisor) redirect('/dashboard')

  let query = supabase
    .from('coaching_requests')
    .select('*, school_advisors ( id, full_name )')
    .eq('school_id', advisor.schoolId)
    .order('created_at', { ascending: false })

  if (params.type) query = query.eq('type', params.type)
  if (params.status) query = query.eq('status', params.status)
  if (params.advisor_id) query = query.eq('advisor_id', params.advisor_id)

  const [{ data: requests }, { data: advisorsList }] = await Promise.all([
    query,
    supabase
      .from('school_advisors')
      .select('id, full_name')
      .eq('school_id', advisor.schoolId),
  ])

  // Profils diplômés
  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))]
  const nameByUser = new Map<string, string>()
  const programByUser = new Map<string, string>()
  if (userIds.length > 0) {
    const [profilesRes, membersRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
      supabase.from('school_members').select('user_id, program').in('user_id', userIds),
    ])
    for (const p of profilesRes.data ?? []) {
      nameByUser.set(
        p.id,
        [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email || 'Diplômé',
      )
    }
    for (const m of membersRes.data ?? []) programByUser.set(m.user_id, m.program || '')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-balance">Demandes de coaching</h1>
        <p className="text-muted-foreground mt-1">
          {(requests ?? []).length} demande{(requests ?? []).length > 1 ? 's' : ''}
        </p>
      </div>

      <CoachingFilters advisors={advisorsList ?? []} />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diplômé</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coach assigné</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requests ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune demande ne correspond à ces critères.
                  </TableCell>
                </TableRow>
              )}
              {(requests ?? []).map((r) => {
                const overdue = r.status === 'pending' && hoursSince(r.created_at) > 48
                const advisorName = (r.school_advisors as { full_name?: string } | null)?.full_name
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/school/coaching/${r.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        {overdue && (
                          <span
                            className="w-2 h-2 rounded-full bg-destructive shrink-0"
                            title="En attente depuis +48h"
                            aria-label="En attente depuis plus de 48 heures"
                          />
                        )}
                        {nameByUser.get(r.user_id) ?? 'Diplômé'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {programByUser.get(r.user_id) || '—'}
                    </TableCell>
                    <TableCell>{COACHING_TYPE_LABELS[r.type] ?? r.type}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(r.created_at)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                          COACHING_STATUS_STYLES[r.status] ?? 'bg-muted text-muted-foreground',
                        )}
                      >
                        {COACHING_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{advisorName ?? '—'}</TableCell>
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
