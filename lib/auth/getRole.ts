import type { SupabaseClient } from '@supabase/supabase-js'

export type UserRole =
  | { role: 'advisor'; school_id: string; advisor_role: string }
  | { role: 'graduate'; school_id: string; status: string }
  | { role: 'unknown' }
  | null

/**
 * Détermine le rôle de l'utilisateur connecté :
 * - 'advisor'  : membre de school_advisors (accès espace école)
 * - 'graduate' : membre de school_members (accès espace diplômé)
 * - 'unknown'  : connecté mais sans rattachement école
 * - null       : non connecté
 */
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: advisor } = await supabase
    .from('school_advisors')
    .select('school_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (advisor) {
    return { role: 'advisor', school_id: advisor.school_id, advisor_role: advisor.role }
  }

  const { data: member } = await supabase
    .from('school_members')
    .select('school_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (member) {
    return { role: 'graduate', school_id: member.school_id, status: member.status }
  }

  return { role: 'unknown' }
}

/** Destination après connexion en fonction du rôle. */
export function landingPathForRole(role: UserRole): string {
  if (role?.role === 'advisor') return '/school/dashboard'
  return '/dashboard'
}
