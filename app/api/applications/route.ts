import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET : toutes les candidatures du diplômé connecté
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}

// POST : crée une candidature
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.company_name || !body?.job_title) {
    return NextResponse.json(
      { error: 'company_name et job_title sont requis' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company_name: String(body.company_name).trim(),
      job_title: String(body.job_title).trim(),
      applied_at: body.applied_at || null,
      status: body.status || 'pending',
      analysis_id: body.analysis_id || null,
      notes: body.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: data }, { status: 201 })
}
