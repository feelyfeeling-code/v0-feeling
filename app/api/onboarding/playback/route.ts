import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { OnboardingData } from '@/components/onboarding/onboarding-flow'

const PlaybackSchema = z.object({
  bloc1: z.object({
    titre: z.string(),
    contenu: z.string(),
  }),
  bloc2: z.object({
    titre: z.string(),
    contenu: z.string(),
  }),
  bloc3: z.object({
    titre: z.string(),
    contenu: z.string(),
  }),
  bloc4: z.object({
    titre: z.string(),
    contenu: z.string(),
  }),
})

const TRAIT_LABELS: Record<string, string> = {
  curious: 'Curieux',
  rigorous: 'Rigoureux',
  empathetic: 'Empathique',
  creative: 'Créatif',
  leader: 'Leadership',
  autonomous: 'Autonome',
  analytical: 'Analytique',
  communicator: 'Communicant',
  resilient: 'Résilient',
  organized: 'Organisé',
  collaborative: 'Collaboratif',
  adaptable: 'Adaptable',
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  autonomie: 'Autonomie',
  collaboration: 'Collaboration',
  cadre_structure: 'Cadre structuré',
  creativite: 'Créativité',
  challenge: 'Challenge',
  stabilite: 'Stabilité',
  impact_concret: 'Impact concret',
  autre: 'Autre',
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
  forte_pression: 'Une forte pression sur les résultats',
  pas_feedback: 'Peu ou pas de feedback',
  pas_flexibilite: 'Aucune flexibilité des horaires',
  management_autoritaire: 'Un management trop autoritaire',
  pas_evolution: "Pas de perspectives d'évolution",
  mauvaise_ambiance: "Une mauvaise ambiance d'équipe",
  heures_sup: 'Des heures supplémentaires fréquentes',
  travail_repetitif: 'Un travail répétitif et sans variété',
  aucune_reconnaissance: 'Aucune reconnaissance du travail',
  manque_sens: 'Un manque de sens dans les missions',
}

const WHEN_IN_ELEMENT_LABELS: Record<string, string> = {
  resoudre_probleme: 'en résolvant des problèmes complexes',
  collaborer: 'en collaborant avec une équipe',
  creer: 'en créant quelque chose de nouveau',
  impact_concret: "en voyant l'impact concret de mon travail",
  organisation: 'en étant bien organisé et efficace',
}

const REACTION_FAILURE_LABELS: Record<string, string> = {
  rebondit_vite: 'rebondit vite',
  analyse: 'analyse ce qui s\'est passé',
  besoin_temps: 'a besoin de temps',
  cherche_soutien: 'cherche du soutien',
}

const APPROACH_PROBLEM_LABELS: Record<string, string> = {
  cherche_methode: 'cherche une méthode',
  teste_solutions: 'teste des solutions',
  demande_aide: 'demande de l\'aide',
  analyse_avant: 'analyse avant d\'agir',
}

function buildPrompt(data: OnboardingData): string {
  const { values, personality, dreamJob } = data

  const traits = (personality.traits ?? []).map((t) => TRAIT_LABELS[t] ?? t)
  const environment = (values.ideal_environment ?? []).map((e) => ENVIRONMENT_LABELS[e] ?? e)
  const selectedValues = (values.selected_values ?? []).map((v) => VALUE_LABELS[v] ?? v)
  const dealbreakers = (values.dealbreakers ?? []).map((d) => DEALBREAKER_LABELS[d] ?? d)
  const whenInElement = WHEN_IN_ELEMENT_LABELS[personality.when_in_element] ?? personality.when_in_element
  const reactionFailure = REACTION_FAILURE_LABELS[personality.reaction_to_failure] ?? personality.reaction_to_failure
  const approachProblem = APPROACH_PROBLEM_LABELS[personality.approach_complex_problem] ?? personality.approach_complex_problem

  const soloTeam = values.work_solo_team_slider ?? 3
  const structure = values.work_structure_slider ?? 3
  const soloTeamDesc = soloTeam <= 2 ? 'plutôt en solo' : soloTeam >= 4 ? 'plutôt en équipe' : 'aussi bien seul qu\'en équipe'
  const structureDesc = structure <= 2 ? 'avec un cadre structuré' : structure >= 4 ? 'en pleine autonomie' : 'avec un équilibre entre cadre et autonomie'

  const lines: string[] = [
    `Traits de personnalité dominants (par ordre) : ${traits.join(', ') || 'non renseigné'}`,
    `Environnement idéal : ${environment.join(', ') || 'non renseigné'}`,
    `Ce qui compte le plus au travail : ${selectedValues.join(', ') || 'non renseigné'}`,
    `Ce qu'il ne veut/voulait absolument pas : ${dealbreakers.join(', ') || 'non renseigné'}`,
    `Mode de travail : ${soloTeamDesc}, ${structureDesc}`,
    `Plusieurs projets en parallèle : ${values.multi_project_comfort || 'non renseigné'}`,
    `Ce qui l'a le plus motivé : ${values.motivation_text || 'non renseigné'}`,
    personality.has_taken_test
      ? `Test de personnalité : ${personality.test_type} — résultat : ${personality.test_result}`
      : `Pas de test de personnalité externe`,
    `Se sent dans son élément quand : ${whenInElement || 'non renseigné'}`,
    `Face à un échec : ${reactionFailure || 'non renseigné'}`,
    `Face à un problème complexe : ${approachProblem || 'non renseigné'}`,
    `Vision dans 2 ans : ${dreamJob.vision_2_years || 'non renseigné'}`,
    `Postes visés : ${(dreamJob.job_titles ?? []).join(', ') || 'non renseigné'}`,
    `Secteurs : ${(dreamJob.industries ?? []).join(', ') || 'non renseigné'}`,
  ]

  return lines.join('\n')
}

export const PLAYBACK_SYSTEM_PROMPT = `Tu es Feely, l'assistant bienveillant de l'application Feeling.
Tu analyses le profil d'un utilisateur et tu génères un playback en 4 blocs.
Règles strictes :
- Toujours tutoyer
- Ne jamais répéter les réponses telles quelles
- Toujours interpréter, jamais lister
- Ne jamais dire "tu ne te connais pas"
- Ne jamais comparer à un test de personnalité
- Ton chaleureux, honnête, bienveillant
- Pas de tirets longs (— ou –)
- Phrases courtes, maximum 2 lignes par phrase
- Texte continu, pas de listes à puces
- Chaque bloc : 3 à 5 phrases maximum`

export const PLAYBACK_USER_PROMPT = (summary: string) => `Voici le profil de l'utilisateur :
${summary}

Génère 4 blocs d'interprétation. Pour chaque bloc, utilise exactement ces titres :
- bloc1.titre = "Ce qui te motive vraiment"
- bloc2.titre = "Comment tu fonctionnes"
- bloc3.titre = "Ce que tu cherches sans forcément le savoir"
- bloc4.titre = "Ce à quoi faire attention"

Consignes par bloc :
BLOC 1 : Interpréter les valeurs et l'environnement idéal. Expliquer ce qu'elles impliquent concrètement, sans répéter les valeurs sélectionnées.
BLOC 2 : Interpréter les traits de personnalité et les comportements au travail. Expliquer ce que ça veut dire en situation réelle.
BLOC 3 (le plus important) : Formuler quelque chose que l'utilisateur n'a pas explicitement dit mais qui ressort de l'ensemble de ses réponses.
BLOC 4 : Un point honnête sur ce qui pourrait poser problème dans la recherche, basé sur le profil.`

export async function POST(req: NextRequest) {
  try {
    const { data } = (await req.json()) as { data: OnboardingData }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const profileSummary = buildPrompt(data)

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: PlaybackSchema,
      system: PLAYBACK_SYSTEM_PROMPT,
      prompt: PLAYBACK_USER_PROMPT(profileSummary),
    })

    // Sauvegarder en base si l'utilisateur est authentifié
    if (user) {
      await supabase
        .from('profiles')
        .update({ playback_result: object })
        .eq('id', user.id)
    }

    return NextResponse.json(object)
  } catch (error) {
    console.error('[playback] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du playback' }, { status: 500 })
  }
}
