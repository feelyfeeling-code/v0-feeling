import type { SupabaseClient } from '@supabase/supabase-js'

export interface GraduateRow {
  user_id: string
  full_name: string
  email: string | null
  program: string | null
  graduation_date: string | null
  graduation_year: number | null
  status: string
  last_active_at: string | null
  application_count: number
  pending_coaching: number
  average_score: number | null
}

export interface GraduateFilters {
  status?: string | null
  program?: string | null
  search?: string | null
  coaching?: string | null // 'pending' | 'none'
}

/**
 * Liste des diplômés d'une école avec indicateurs agrégés
 * (candidatures, demandes de coaching en attente, score moyen).
 */
export async function getSchoolGraduates(
  supabase: SupabaseClient,
  schoolId: string,
  filters: GraduateFilters = {},
): Promise<GraduateRow[]> {
  let membersQuery = supabase
    .from('school_members')
    .select('user_id, status, program, graduation_year, last_active_at, created_at')
    .eq('school_id', schoolId)

  if (filters.status) membersQuery = membersQuery.eq('status', filters.status)
  if (filters.program) membersQuery = membersQuery.eq('program', filters.program)

  const { data: members } = await membersQuery
  const userIds = (members ?? []).map((m) => m.user_id)
  if (userIds.length === 0) return []

  const [profilesRes, academicRes, applicationsRes, coachingRes, analysesRes] =
    await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
      supabase
        .from('academic_profiles')
        .select('user_id, diploma_name, graduation_date')
        .in('user_id', userIds),
      supabase.from('applications').select('user_id, status').in('user_id', userIds),
      supabase
        .from('coaching_requests')
        .select('user_id, status')
        .eq('school_id', schoolId)
        .in('user_id', userIds),
      supabase.from('job_analyses').select('user_id, overall_score').in('user_id', userIds),
    ])

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
  const academicByUser = new Map((academicRes.data ?? []).map((a) => [a.user_id, a]))

  const appCount = new Map<string, number>()
  for (const a of applicationsRes.data ?? []) {
    appCount.set(a.user_id, (appCount.get(a.user_id) ?? 0) + 1)
  }

  const pendingCoaching = new Map<string, number>()
  for (const c of coachingRes.data ?? []) {
    if (c.status === 'pending') {
      pendingCoaching.set(c.user_id, (pendingCoaching.get(c.user_id) ?? 0) + 1)
    }
  }

  const scoreAgg = new Map<string, { sum: number; n: number }>()
  for (const j of analysesRes.data ?? []) {
    if (typeof j.overall_score === 'number') {
      const cur = scoreAgg.get(j.user_id) ?? { sum: 0, n: 0 }
      cur.sum += j.overall_score
      cur.n += 1
      scoreAgg.set(j.user_id, cur)
    }
  }

  let graduates: GraduateRow[] = (members ?? []).map((m) => {
    const profile = profileById.get(m.user_id)
    const academic = academicByUser.get(m.user_id)
    const score = scoreAgg.get(m.user_id)
    const fullName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      profile?.email ||
      'Diplômé'

    return {
      user_id: m.user_id,
      full_name: fullName,
      email: profile?.email ?? null,
      program: m.program || academic?.diploma_name || null,
      graduation_date: academic?.graduation_date || null,
      graduation_year: m.graduation_year,
      status: m.status,
      last_active_at: m.last_active_at,
      application_count: appCount.get(m.user_id) ?? 0,
      pending_coaching: pendingCoaching.get(m.user_id) ?? 0,
      average_score: score ? Math.round(score.sum / score.n) : null,
    }
  })

  const search = filters.search?.toLowerCase().trim()
  if (search) {
    graduates = graduates.filter((g) => g.full_name.toLowerCase().includes(search))
  }
  if (filters.coaching === 'pending') {
    graduates = graduates.filter((g) => g.pending_coaching > 0)
  } else if (filters.coaching === 'none') {
    graduates = graduates.filter((g) => g.pending_coaching === 0)
  }

  graduates.sort((a, b) => a.full_name.localeCompare(b.full_name))
  return graduates
}

/** Programmes distincts d'une école, pour alimenter les filtres. */
export async function getSchoolPrograms(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('school_members')
    .select('program')
    .eq('school_id', schoolId)
  const set = new Set<string>()
  for (const m of data ?? []) {
    if (m.program) set.add(m.program)
  }
  return [...set].sort()
}
