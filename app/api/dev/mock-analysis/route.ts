import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ⚠️ Cette route n'est disponible qu'en développement local.
// Elle insère une fausse analyse complète sans appeler l'API Anthropic.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 403 })
  }

  const { userId, preset = 'good' } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const presets: Record<string, {
    label: string
    overall_score: number
    personality_score: number
    values_score: number
    skills_score: number | null
    has_dealbreakers: boolean
    dealbreaker_details: string[] | null
  }> = {
    good: {
      label: 'Bon match (78%)',
      overall_score: 78,
      personality_score: 82,
      values_score: 74,
      skills_score: 80,
      has_dealbreakers: false,
      dealbreaker_details: null,
    },
    average: {
      label: 'Match moyen (51%)',
      overall_score: 51,
      personality_score: 60,
      values_score: 45,
      skills_score: 55,
      has_dealbreakers: false,
      dealbreaker_details: null,
    },
    bad: {
      label: 'Mauvais match (28%)',
      overall_score: 28,
      personality_score: 35,
      values_score: 20,
      skills_score: 30,
      has_dealbreakers: true,
      dealbreaker_details: ['management_autoritaire', 'forte_pression'],
    },
    no_skills: {
      label: 'Sans profil technique (65%)',
      overall_score: 65,
      personality_score: 70,
      values_score: 60,
      skills_score: null,
      has_dealbreakers: false,
      dealbreaker_details: null,
    },
  }

  const p = presets[preset] ?? presets.good

  const mockAnalysis = {
    user_id: userId,
    job_url: 'https://example.com/offre-mock',
    job_title: 'Chargé de projet digital',
    company_name: 'Feeling Corp',
    job_description: 'Offre fictive générée pour les tests en développement.',
    job_location: 'Paris, France',
    job_type: 'CDI',
    job_remote: 'Hybride',
    overall_score: p.overall_score,
    personality_score: p.personality_score,
    values_score: p.values_score,
    skills_score: p.skills_score,
    has_dealbreakers: p.has_dealbreakers,
    dealbreaker_details: p.dealbreaker_details,
    strengths: [
      'Ton sens de l\'organisation colle parfaitement avec les missions de coordination du poste.',
      'Ton attrait pour l\'impact concret est un vrai atout dans ce secteur orienté résultats.',
      'Tes expériences passées en gestion de projet sont directement transférables.',
    ],
    attention_points: [
      'Le poste implique une forte pression sur les délais, assure-toi que ça te convient.',
      'La culture startup peut diverger de tes attentes sur la flexibilité des horaires.',
    ],
    personality_analysis: {
      strengths: [
        'Ton leadership naturel est un vrai plus pour ce rôle de coordination entre équipes.',
        'Ta rigueur et ton sens de l\'organisation font écho aux exigences de pilotage de projets.',
        'Ton côté analytique t\'aidera à structurer les priorités dans un environnement mouvant.',
      ],
      attentionPoints: [
        'Le poste demande beaucoup d\'adaptabilité rapide, ce qui peut parfois être en tension avec ton besoin de planification.',
      ],
    },
    values_analysis: {
      strengths: [
        'L\'entreprise met en avant l\'autonomie et la prise d\'initiatives, ce qui correspond à tes valeurs.',
        'Le projet a un impact sociétal fort, cohérent avec ton besoin de donner du sens à ton travail.',
      ],
      attentionPoints: [
        'L\'offre ne mentionne pas de politique claire de télétravail, or c\'est une valeur importante pour toi.',
        'La culture semble très orientée performance, ce qui peut être en friction avec ton besoin d\'équilibre.',
      ],
    },
    skills_analysis: p.skills_score !== null ? {
      strengths: [
        'Ta maîtrise de Notion et des outils de gestion de projet est directement demandée dans l\'offre.',
        'Ton expérience en coordination d\'équipes pluridisciplinaires correspond aux missions du poste.',
      ],
      attentionPoints: [
        'Le poste requiert une expérience en SEO/SEM que tu n\'as pas encore dans ton profil.',
      ],
    } : null,
  }

  const { data: saved, error } = await supabase
    .from('job_analyses')
    .insert(mockAnalysis)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ analysisId: saved.id, preset: p.label, success: true })
}
