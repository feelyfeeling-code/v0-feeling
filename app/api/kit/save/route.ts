import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { analysisId, cv, coverLetter } = await request.json()
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('job_analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()
    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })
    }

    const update: Record<string, unknown> = {
      user_id: user.id,
      analysis_id: analysisId,
    }
    if (cv !== undefined) update.cv_data = cv
    if (coverLetter !== undefined) update.cover_letter = coverLetter

    const { error: upsertError } = await supabase
      .from('application_kits')
      .upsert(update, { onConflict: 'user_id,analysis_id' })

    if (upsertError) {
      console.error('[kit/save] upsert error', upsertError)
      return NextResponse.json(
        { error: `Erreur sauvegarde : ${upsertError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[kit/save] error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
