import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { NextResponse } from 'next/server'

// GET : stats du dashboard pour l'école du conseiller connecté
export async function GET() {
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  // Stats agrégées depuis la vue
  const { data: stats, error: statsError } = await supabase
    .from('school_dashboard_stats')
    .select('*')
    .eq('school_id', advisor.schoolId)
    .maybeSingle()

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 })
  }

  // Détail des membres pour calculer les taux d'insertion (6 / 18 mois)
  const { data: members, error: membersError } = await supabase
    .from('school_members')
    .select('status, graduation_year, created_at, last_active_at')
    .eq('school_id', advisor.schoolId)

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  const now = Date.now()
  const monthsAgo = (m: number) => now - m * 30 * 24 * 60 * 60 * 1000

  const cohort = (sinceMs: number) =>
    (members ?? []).filter((m) => new Date(m.created_at).getTime() <= sinceMs)

  const insertionRate = (sinceMs: number) => {
    const c = cohort(sinceMs)
    if (c.length === 0) return null
    const employed = c.filter((m) => m.status === 'employed').length
    return Math.round((employed / c.length) * 100)
  }

  const total = members?.length ?? 0
  // Taux de réponse : diplômés ayant mis à jour leur statut (last_active_at)
  const responded = (members ?? []).filter((m) => Boolean(m.last_active_at)).length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : null

  return NextResponse.json({
    stats: stats ?? {
      school_id: advisor.schoolId,
      total_graduates: 0,
      employed: 0,
      searching: 0,
      in_studies: 0,
      on_break: 0,
      inactive_alert: 0,
      pending_requests: 0,
    },
    insertion: {
      at_6_months: insertionRate(monthsAgo(6)),
      at_18_months: insertionRate(monthsAgo(18)),
      response_rate: responseRate,
    },
  })
}
