import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdvisorContext {
  userId: string
  advisorId: string
  schoolId: string
  role: string
}

/**
 * Vérifie que l'utilisateur connecté est conseiller d'une école.
 * Retourne le contexte conseiller, ou null si non autorisé.
 */
export async function requireAdvisor(
  supabase: SupabaseClient,
): Promise<AdvisorContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: advisor } = await supabase
    .from('school_advisors')
    .select('id, school_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!advisor) return null

  return {
    userId: user.id,
    advisorId: advisor.id,
    schoolId: advisor.school_id,
    role: advisor.role,
  }
}
