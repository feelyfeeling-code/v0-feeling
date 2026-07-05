import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { NextResponse } from 'next/server'

// GET : demandes de coaching de l'école (+ profil diplômé + conseiller)
// Params optionnels : ?status=pending&type=interview_prep&advisor_id=xxx
export async function GET(request: Request) {
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const typeFilter = searchParams.get('type')
  const advisorFilter = searchParams.get('advisor_id')

  let query = supabase
    .from('coaching_requests')
    .select('*, school_advisors ( id, full_name )')
    .eq('school_id', advisor.schoolId)
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (typeFilter) query = query.eq('type', typeFilter)
  if (advisorFilter) query = query.eq('advisor_id', advisorFilter)

  const { data: requests, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Profils des diplômés concernés
  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))]
  const profileById = new Map<string, { first_name: string; last_name: string; email: string }>()
  const programByUser = new Map<string, string>()

  if (userIds.length > 0) {
    const [profilesRes, membersRes, academicRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
      supabase.from('school_members').select('user_id, program').in('user_id', userIds),
      supabase.from('academic_profiles').select('user_id, diploma_name').in('user_id', userIds),
    ])
    for (const p of profilesRes.data ?? []) profileById.set(p.id, p as never)
    const academicByUser = new Map(
      (academicRes.data ?? []).map((a) => [a.user_id, a.diploma_name]),
    )
    for (const m of membersRes.data ?? []) {
      programByUser.set(m.user_id, m.program || academicByUser.get(m.user_id) || '')
    }
  }

  const enriched = (requests ?? []).map((r) => {
    const p = profileById.get(r.user_id)
    const fullName =
      [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || p?.email || 'Diplômé'
    return {
      ...r,
      graduate_name: fullName,
      graduate_program: programByUser.get(r.user_id) || null,
    }
  })

  // Liste des conseillers de l'école (pour l'assignation)
  const { data: advisors } = await supabase
    .from('school_advisors')
    .select('id, full_name, role')
    .eq('school_id', advisor.schoolId)

  return NextResponse.json({ requests: enriched, advisors: advisors ?? [] })
}

// PATCH : assigner un conseiller / changer le statut d'une demande
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.request_id) {
    return NextResponse.json({ error: 'request_id requis' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.advisor_id !== undefined) update.advisor_id = body.advisor_id || null
  if (body.status) update.status = body.status
  if (body.scheduled_at !== undefined) update.scheduled_at = body.scheduled_at || null

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('coaching_requests')
    .update(update)
    .eq('id', body.request_id)
    .eq('school_id', advisor.schoolId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data })
}
