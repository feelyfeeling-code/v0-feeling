import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PLAYBACK_SYSTEM_PROMPT, PLAYBACK_USER_PROMPT } from '../route'

const PlaybackSchema = z.object({
  bloc1: z.object({ titre: z.string(), contenu: z.string() }),
  bloc2: z.object({ titre: z.string(), contenu: z.string() }),
  bloc3: z.object({ titre: z.string(), contenu: z.string() }),
  bloc4: z.object({ titre: z.string(), contenu: z.string() }),
})

const TRAIT_LABELS: Record<string, string> = {
  curious: 'Curieux', rigorous: 'Rigoureux', empathetic: 'Empathique',
  creative: 'Créatif', leader: 'Leadership', autonomous: 'Autonome',
  analytical: 'Analytique', communicator: 'Communicant', resilient: 'Résilient',
  organized: 'Organisé', collaborative: 'Collaboratif', adaptable: 'Adaptable',
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  autonomie: 'Autonomie', collaboration: 'Collaboration', cadre_structure: 'Cadre structuré',
  creativite: 'Créativité', challenge: 'Challenge', stabilite: 'Stabilité',
  impact_concret: 'Impact concret', autre: 'Autre',
}

const VALUE_LABELS: Record<string, string> = {
  impact_mission: "L'impact de ma mission",
  ambiance_collegues: "L'ambiance avec les collègues",
  evolution: "Les possibilités d'évolution",
  autonomie: "L'autonomie dans mon travail",
  valeurs_entreprise: "Les valeurs de l'entreprise",
  remuneration: 'Une rémunération attractive',
  equilibre_vie: "L'équilibre vie pro / vie perso",
  apprentissage: "Les opportunités d'apprentissage",
  flexibilite_horaires: 'La flexibilité des horaires',
  diversite_missions: 'La diversité des missions',
}

const DEALBREAKER_LABELS: Record<string, string> = {
  forte_pression: 'Une forte pression', pas_feedback: 'Peu ou pas de feedback',
  pas_flexibilite: 'Aucune flexibilité', management_autoritaire: 'Management autoritaire',
  pas_evolution: "Pas d'évolution", mauvaise_ambiance: "Mauvaise ambiance",
  heures_sup: 'Heures supplémentaires', travail_repetitif: 'Travail répétitif',
  aucune_reconnaissance: 'Aucune reconnaissance', manque_sens: 'Manque de sens',
}

const SOLO_TEAM_LABELS: Record<number, string> = {
  1: 'très majoritairement seul', 2: 'plutôt seul',
  3: 'aussi bien seul qu\'en équipe', 4: 'plutôt en équipe', 5: 'très majoritairement en équipe',
}

const STRUCTURE_LABELS: Record<number, string> = {
  1: 'avec beaucoup de structure', 2: 'avec un cadre assez défini',
  3: 'avec un équilibre structure/autonomie', 4: 'avec beaucoup d\'autonomie', 5: 'en pleine autonomie',
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    // Lire toutes les données du profil depuis Supabase
    const [personalityRes, valuesRes, dreamJobRes] = await Promise.all([
      supabase.from('personality_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('values_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('dream_jobs').select('*').eq('user_id', user.id).single(),
    ])

    const p = personalityRes.data ?? {}
    const v = valuesRes.data ?? {}
    const d = dreamJobRes.data ?? {}

    const traits = ((p.traits ?? []) as string[]).map((t: string) => TRAIT_LABELS[t] ?? t)
    const environment = ((v.ideal_environment ?? []) as string[]).map((e: string) => ENVIRONMENT_LABELS[e] ?? e)
    const selectedValues = ((v.selected_values ?? []) as string[]).map((val: string) => VALUE_LABELS[val] ?? val)
    const dealbreakers = ((v.dealbreakers ?? []) as string[]).map((db: string) => DEALBREAKER_LABELS[db] ?? db)

    const soloTeam = v.work_solo_team_slider ?? 3
    const structure = v.work_structure_slider ?? 3

    const lines = [
      `Traits de personnalité dominants (par ordre) : ${traits.join(', ') || 'non renseigné'}`,
      `Environnement idéal : ${environment.join(', ') || 'non renseigné'}`,
      `Ce qui compte le plus au travail : ${selectedValues.join(', ') || 'non renseigné'}`,
      `Ce qu'il/elle ne veut absolument pas : ${dealbreakers.join(', ') || 'non renseigné'}`,
      `Mode de travail : ${SOLO_TEAM_LABELS[soloTeam] ?? ''}, ${STRUCTURE_LABELS[structure] ?? ''}`,
      `Plusieurs projets en parallèle : ${v.multi_project_comfort || 'non renseigné'}`,
      `Ce qui l'a le plus motivé : ${v.motivation_text || 'non renseigné'}`,
      p.has_taken_test
        ? `Test de personnalité : ${p.test_type} — résultat : ${p.test_result}`
        : `Pas de test de personnalité externe`,
      `Se sent dans son élément quand : ${p.when_in_element || 'non renseigné'}`,
      `Face à un échec : ${p.reaction_to_failure || 'non renseigné'}`,
      `Face à un problème complexe : ${p.approach_complex_problem || 'non renseigné'}`,
      `Vision dans 2 ans : ${d.vision_2_years || 'non renseigné'}`,
      `Postes visés : ${(d.job_titles ?? []).join(', ') || 'non renseigné'}`,
      `Secteurs : ${(d.industries ?? []).join(', ') || 'non renseigné'}`,
    ]

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: PlaybackSchema,
      system: PLAYBACK_SYSTEM_PROMPT,
      prompt: PLAYBACK_USER_PROMPT(lines.join('\n')),
    })

    // Sauvegarder le nouveau playback
    await supabase
      .from('profiles')
      .update({ playback_result: object })
      .eq('id', user.id)

    return NextResponse.json(object)
  } catch (error) {
    console.error('[playback/regenerate] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la régénération' }, { status: 500 })
  }
}
