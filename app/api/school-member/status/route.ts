import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['searching', 'employed', 'inactive', 'studies', 'break']

// PATCH : met à jour le statut du diplômé + last_active_at
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  const update: Record<string, unknown> = {
    last_active_at: new Date().toISOString(),
  }

  if (body?.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }
    update.status = body.status
  }

  const { data, error } = await supabase
    .from('school_members')
    .update(update)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ member: data })
}
