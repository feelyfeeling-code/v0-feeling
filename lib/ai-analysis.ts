import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import type { JobData } from './scraper'

interface TechnicalProfile {
  skills: string[]
  experiences: Array<{
    job_title: string
    company_name: string
    start_date: string
    end_date?: string | null
    is_current: boolean
    main_tasks?: string | null
  }>
}

interface UserProfiles {
  jobData: JobData
  personality: {
    traits: string[]
    has_taken_test: boolean
    test_type: string | null
    test_result: string | null
    test_answers: Record<string, number>
  }
  values: {
    selected_values: string[]
    dealbreakers: string[]
  }
  dreamJob: {
    job_titles: string[]
    locations: string[]
    location_radius: number
    industries: string[]
    salary_range: string | null
    remote_preference: string | null
  } | null
  currentSituation?: {
    situations: string[]
    job_search_types: string[]
  } | null
  technicalProfile?: TechnicalProfile | null
}

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

const TEST_TYPE_LABELS: Record<string, string> = {
  mbti: 'MBTI',
  disc: 'DISC',
  big_five: 'Big Five / OCEAN',
  enneagram: 'Ennéagramme',
  other: 'Autre test',
}

const VALUE_LABELS: Record<string, string> = {
  impact_concret: 'Avoir un impact concret',
  ambiance_equipe: "Avoir une bonne ambiance d'équipe",
  horaires_flexibles: 'Avoir des horaires flexibles',
  apprendre_continu: 'Apprendre en continu',
  sens_travail: 'Donner du sens à son travail',
  evoluer_rapidement: 'Évoluer rapidement',
  temps_pour_soi: 'Garder du temps pour soi',
  autonomie: 'Travailler en autonomie',
  travail_equipe: 'Travailler en équipe',
  initiatives: 'Prendre des initiatives',
}

const DEALBREAKER_LABELS: Record<string, string> = {
  management_autoritaire: 'Un management trop autoritaire',
  pas_evolution: "Pas de perspectives d'évolution",
  mauvaise_ambiance: "Une mauvaise ambiance d'équipe",
  travail_repetitif: 'Un travail répétitif et sans variété',
  aucune_reconnaissance: 'Aucune reconnaissance du travail',
  manque_sens: 'Un manque de sens dans les missions',
  forte_pression: 'Une forte pression sur les résultats',
  pas_feedback: 'Peu ou pas de feedback',
  pas_flexibilite: 'Aucune flexibilité des horaires',
  heures_sup: 'Des heures supplémentaires fréquentes',
}

const TRAIT_WEIGHTS = ['50%', '30%', '20%']

const SITUATION_LABELS: Record<string, string> = {
  job_seeking: "En recherche d'emploi",
  employed: 'En poste',
  student: 'En études',
}

const CONTRACT_LABELS: Record<string, string> = {
  cdd: 'CDD',
  cdi: 'CDI',
  alternance: 'Alternance',
}

function formatSituations(
  situation?: { situations: string[]; job_search_types: string[] } | null
): string {
  if (!situation?.situations?.length) return 'Non renseignée'
  return situation.situations
    .map((key) => {
      const label = SITUATION_LABELS[key] ?? key
      if (key === 'job_seeking' && situation.job_search_types.length > 0) {
        const contracts = situation.job_search_types
          .map((c) => CONTRACT_LABELS[c] ?? c)
          .join(', ')
        return `${label} (${contracts})`
      }
      return label
    })
    .join(' + ')
}

const analysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Score global de compatibilité'),
  personalityScore: z.number().min(0).max(100).describe('Score de compatibilité personnalité'),
  valuesScore: z.number().min(0).max(100).describe('Score de compatibilité valeurs et culture'),
  skillsScore: z.number().min(0).max(100).nullable().describe('Score de compatibilité compétences (null si non évaluable)'),
  
  personalityAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts personnalité'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention personnalité'),
  }),
  
  valuesAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts valeurs/culture'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention valeurs/culture'),
  }),
  
  skillsAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts compétences'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention compétences'),
  }).nullable(),
  
  strengths: z.array(z.string()).describe('Liste des points forts généraux'),
  attentionPoints: z.array(z.string()).describe('Liste des points d\'attention généraux'),
  
  hasDealbreakers: z.boolean().describe('Présence de critères rédhibitoires'),
  dealbreakerDetails: z.array(z.string()).nullable().describe('Détails des critères rédhibitoires'),
})

export type AnalysisResult = z.infer<typeof analysisSchema>

export async function analyzeJobMatch(profiles: UserProfiles): Promise<AnalysisResult> {
  const { jobData, personality, values, dreamJob, currentSituation, technicalProfile } = profiles
  
  const rankedTraits = personality.traits
    .map((t, i) => `${i + 1}. ${TRAIT_LABELS[t] ?? t}`)
    .join('\n')

  const INTEGRATED_TEST_TEXTS: Record<string, string> = {
    q1: "À l'aise dans des situations sociales nouvelles",
    q2: 'Préfère planifier plutôt qu\'improviser',
    q3: 'Prend des décisions rapidement même dans l\'incertitude',
    q4: 'Préfère le travail en équipe au travail solo',
    q5: 'Curieux d\'apprendre hors de son domaine',
    q6: 'Reste calme face au stress',
    q7: 'Exprime son désaccord sans hésiter',
    q8: 'Préfère suivre les règles plutôt que les remettre en question',
    q9: 'Aime résoudre des problèmes complexes',
    q10: 'Se remet facilement d\'un échec',
  }

  const hasIntegratedAnswers =
    !personality.has_taken_test &&
    Object.keys(personality.test_answers ?? {}).length > 0

  const integratedTestInfo = hasIntegratedAnswers
    ? `Le candidat a passé le mini-test de personnalité intégré (Likert 1-5, 1 = pas du tout d'accord, 5 = tout à fait d'accord) :\n${Object.entries(
        personality.test_answers
      )
        .map(([id, score]) => `- ${INTEGRATED_TEST_TEXTS[id] ?? id} : ${score}/5`)
        .join('\n')}`
    : ''

  const existingTestInfo =
    personality.has_taken_test && personality.test_type && personality.test_result
      ? `Le candidat a déjà passé un test de personnalité : ${TEST_TYPE_LABELS[personality.test_type] ?? personality.test_type}, résultat : ${personality.test_result}.`
      : hasIntegratedAnswers
        ? integratedTestInfo
        : "Le candidat n'a pas de résultat de test de personnalité."

  const systemPrompt = `Tu es un expert en analyse de compatibilité emploi-candidat pour l'application Feeling.
Tu analyses les offres d'emploi et évalues leur adéquation avec le profil psychologique et les valeurs d'un candidat.

Tu DOIS tutoyer le candidat dans toutes tes réponses.

RÈGLES DE SCORING:
- Si un critère rédhibitoire du candidat est présent, le score global DOIT être plafonné à 30/100 maximum
- Les scores doivent être réalistes et différenciés (pas tous à 50%)
- Utilise toute la plage de 0 à 100

CRITÈRES RÉDHIBITOIRES POSSIBLES (clés utilisées dans dealbreakerDetails) :
- management_autoritaire : Un management trop autoritaire
- pas_evolution : Pas de perspectives d'évolution
- mauvaise_ambiance : Une mauvaise ambiance d'équipe
- travail_repetitif : Un travail répétitif et sans variété
- aucune_reconnaissance : Aucune reconnaissance du travail
- manque_sens : Un manque de sens dans les missions
- forte_pression : Une forte pression sur les résultats
- pas_feedback : Peu ou pas de feedback
- pas_flexibilite : Aucune flexibilité des horaires
- heures_sup : Des heures supplémentaires fréquentes

Un critère rédhibitoire est "présent" uniquement s'il fait partie des critères sélectionnés par le candidat ET s'il est effectivement constaté dans l'offre analysée.

ANALYSE DE PERSONNALITÉ:
Le candidat a choisi 3 traits dominants, classés par ordre d'importance :
${rankedTraits || '(aucun trait sélectionné)'}

${existingTestInfo}

Pour calculer le score de personnalité, identifie les soft skills attendus dans l'offre et croise-les avec les traits du candidat en respectant la pondération indiquée (rang 1 = 50%, rang 2 = 30%, rang 3 = 20%).`

  const userPrompt = `OFFRE D'EMPLOI:
Titre: ${jobData.title}
Entreprise: ${jobData.company}
Lieu: ${jobData.location}
Type de contrat: ${jobData.type}
Télétravail: ${jobData.remote}

Description:
${jobData.description.slice(0, 4000)}

---

PROFIL DU CANDIDAT:

Situation(s) actuelle(s): ${formatSituations(currentSituation)}

Traits de personnalité dominants (classés par importance) :
${rankedTraits || '(non renseignés)'}
${existingTestInfo}

Valeurs professionnelles les plus importantes (jusqu'à 3) :
${
  values.selected_values.length > 0
    ? values.selected_values.map((v) => `- ${VALUE_LABELS[v] ?? v}`).join('\n')
    : '(aucune valeur sélectionnée)'
}

Critères rédhibitoires du candidat (jusqu'à 3) :
${
  values.dealbreakers.length > 0
    ? values.dealbreakers.map((d) => `- ${DEALBREAKER_LABELS[d] ?? d}`).join('\n')
    : '(aucun critère rédhibitoire)'
}

${dreamJob ? `Job de rêve :
- Poste(s) visé(s) : ${dreamJob.job_titles.length > 0 ? dreamJob.job_titles.join(', ') : '(non renseigné)'}
- Localisation(s) souhaitée(s) : ${dreamJob.locations.length > 0 ? dreamJob.locations.join(', ') : '(non renseignée)'}
- Rayon de recherche : ${dreamJob.location_radius === 0 ? 'Indifférent' : `${dreamJob.location_radius} km`}
- Secteurs d'activité : ${dreamJob.industries.length > 0 ? dreamJob.industries.join(', ') : '(non renseignés)'}
- Tranche de salaire souhaitée : ${dreamJob.salary_range ?? '(non renseignée)'}
- Préférence télétravail : ${dreamJob.remote_preference ?? '(non renseignée)'}` : ''}

${technicalProfile ? `Profil technique:
Compétences: ${technicalProfile.skills.join(', ')}

Expériences professionnelles:
${technicalProfile.experiences.map(e => `- ${e.job_title} chez ${e.company_name} (${e.start_date} - ${e.is_current ? "présent" : e.end_date ?? ""})${e.main_tasks ? `: ${e.main_tasks}` : ""}`).join('\n')}` : 'Profil technique: non renseigné (ne pas évaluer les compétences, retourner skillsScore à null)'}

---

Analyse cette offre par rapport au profil du candidat.
Fournis des insights personnalisés et actionnables.
Prends en compte la/les situation(s) actuelle(s) du candidat (il peut en cumuler plusieurs, par exemple "En poste" ET "En recherche d'emploi (CDI)", ou "En études" ET "En recherche d'emploi (Alternance)") pour adapter tes recommandations.
Vérifie si les critères rédhibitoires sont présents dans l'offre.
${technicalProfile ? 'Évalue également la compatibilité des compétences techniques avec les exigences du poste.' : 'Ne pas évaluer les compétences techniques (skillsScore = null, skillsAnalysis = null).'}
Sois honnête et nuancé dans ton analyse.

CONTRAINTES STRICTES SUR LE FORMAT DES RÉPONSES (NE PAS IGNORER) :
- personalityAnalysis.strengths : exactement 2 à 3 phrases concrètes basées sur les 3 traits dominants du candidat et les soft skills attendus par l'offre. Tutoiement.
- personalityAnalysis.attentionPoints : exactement 1 à 2 phrases sur les risques/frictions liés au profil psychologique face à l'offre.
- valuesAnalysis.strengths : exactement 2 à 3 phrases concrètes croisant les valeurs du candidat avec la culture/organisation perçue de l'entreprise.
- valuesAnalysis.attentionPoints : exactement 1 à 2 phrases sur les écarts entre les valeurs du candidat et ce que propose l'entreprise.
- skillsAnalysis.strengths (si technicalProfile fourni) : 2 à 3 phrases concrètes citant au moins UNE compétence ou expérience précise du candidat face à une exigence précise de l'offre.
- skillsAnalysis.attentionPoints (si technicalProfile fourni) : 1 à 2 phrases mentionnant au moins UNE compétence attendue par l'offre et absente/faible chez le candidat.
- strengths (liste globale) : exactement 2 à 3 phrases courtes qui expliquent la raison principale du match global (ou du mismatch).
  > OBLIGATOIRE : chaque phrase doit mentionner au moins UN élément spécifique du profil candidat (trait, valeur, expérience, compétence, etc.) ET au moins UN élément spécifique de l'offre (mission, tech, secteur, contrat, etc.). Pas de texte générique type "ton profil correspond bien".
  > Si le score global est < 40 ("Faible adéquation") : les phrases doivent nommer EXPLICITEMENT la/les dimensions qui pénalisent (ex: "tes compétences en X manquent"), rester bienveillantes (pas décourageantes), et proposer UNE action concrète (ex: "une formation en Y pourrait renforcer ton profil").
- attentionPoints (liste globale) : 1 à 3 phrases sur les points à surveiller au niveau global.
Chaque phrase doit être directement lisible par le candidat (tutoiement, pas de jargon, pas de paraphrase de l'offre).`

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: analysisSchema,
    system: systemPrompt,
    prompt: userPrompt,
  })

  if (!object) {
    throw new Error('Failed to generate analysis')
  }

  // Recalculate overallScore deterministically from sub-scores so it's always coherent.
  // Without skills: 50% personality + 50% values.
  // With skills: 40% personality + 30% values + 30% skills.
  let result = object
  const computedOverall = result.skillsScore !== null
    ? Math.round(result.personalityScore * 0.4 + result.valuesScore * 0.3 + result.skillsScore * 0.3)
    : Math.round(result.personalityScore * 0.5 + result.valuesScore * 0.5)

  result = { ...result, overallScore: computedOverall }

  // Apply dealbreaker cap after score computation.
  if (result.hasDealbreakers && result.overallScore > 30) {
    result = { ...result, overallScore: 30 }
  }

  return result
}
