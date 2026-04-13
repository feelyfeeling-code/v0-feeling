import type { SupabaseClient } from '@supabase/supabase-js'

export const DAILY_ANALYSIS_LIMIT = 3

/**
 * Compte le nombre d'analyses créées aujourd'hui (UTC) par un utilisateur.
 * Retourne le nombre d'analyses effectuées et indique si la limite est atteinte.
 */
export async function checkDailyAnalysisLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ count: number; exceeded: boolean }> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('job_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())

  if (error) {
    console.error('[rate-limit] count query failed', error)
    // En cas d'erreur de comptage, on laisse passer pour ne pas bloquer l'utilisateur
    return { count: 0, exceeded: false }
  }

  const total = count ?? 0
  return { count: total, exceeded: total >= DAILY_ANALYSIS_LIMIT }
}
