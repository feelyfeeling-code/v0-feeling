import { createClient } from '@/lib/supabase/server'
import { buildFeelyContext } from '@/lib/school/feely-context'
import { NextResponse } from 'next/server'

// GET : demandes de coaching du diplômé + conseiller assigné
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('coaching_requests')
    .select('*, school_advisors ( full_name )')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

// POST : crée une demande de coaching avec feely_context généré automatiquement
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.type || !body?.message) {
    return NextResponse.json({ error: 'type et message sont requis' }, { status: 400 })
  }

  // Résout l'école : soit fournie, soit celle du rattachement du diplômé
  let schoolId: string | null = body.school_id ?? null
  if (!schoolId) {
    const { data: member } = await supabase
      .from('school_members')
      .select('school_id')
      .eq('user_id', user.id)
      .maybeSingle()
    schoolId = member?.school_id ?? null
  }

  if (!schoolId) {
    return NextResponse.json(
      { error: 'Aucune école rattachée à ce compte' },
      { status: 400 },
    )
  }

  const feelyContext = await buildFeelyContext(supabase, user.id)

  const { data, error } = await supabase
    .from('coaching_requests')
    .insert({
      user_id: user.id,
      school_id: schoolId,
      type: body.type,
      message: String(body.message).trim(),
      status: 'pending',
      feely_context: feelyContext,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 201 })
}
