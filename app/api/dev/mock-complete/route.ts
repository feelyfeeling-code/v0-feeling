import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ⚠️ Cette route n'est disponible qu'en développement local.
// Elle finalise une analyse existante avec des compétences fictives sans appeler Anthropic.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  }

  const { analysisId, userId } = await request.json()

  if (!analysisId || !userId) {
    return NextResponse.json({ error: 'analysisId et userId requis' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('job_analyses')
    .select('personality_score, values_score, has_dealbreakers')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })
  }

  const skills_score = 72
  const softScore = Math.round((existing.personality_score + existing.values_score) / 2)
  const rawCombined = Math.round(softScore * 0.5 + skills_score * 0.5)
  const overall_score = existing.has_dealbreakers ? Math.min(rawCombined, 30) : rawCombined

  const { error: updateError } = await supabase
    .from('job_analyses')
    .update({
      skills_score,
      overall_score,
      skills_analysis: {
        strengths: [
          'Ta maîtrise de Notion et des outils de gestion de projet est directement demandée dans l\'offre.',
          'Ton expérience en coordination d\'équipes pluridisciplinaires correspond aux missions du poste.',
        ],
        attentionPoints: [
          'Le poste requiert une expérience en SEO/SEM que tu n\'as pas encore dans ton profil.',
        ],
      },
    })
    .eq('id', analysisId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, analysisId })
}
