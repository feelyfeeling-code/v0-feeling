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

interface AcademicProfile {
  education_level: string
  graduation_date: string
  diploma_name: string
  school_name: string
  field_of_study: string[]
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
  academicProfile?: AcademicProfile | null
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

// ─────────────────────────────────────────────────────────────────────────────
// Règles éditoriales partagées par tous les prompts Feeling.
// Définit la voix de Feely et les contraintes de sortie visibles côté candidat.
// ─────────────────────────────────────────────────────────────────────────────
const feelingEditorialRules = `RÈGLES ÉDITORIALES FEELING (s'appliquent à TOUTE chaîne de sortie visible)

Voix:
- Toujours en français, tutoiement.
- Parle comme Feely: chaleureux, direct, honnête, humain. Pas de jargon RH.
- Pas de flatterie sans raison. Pas de long discours.
- Formule par insight: résultat clair, raison concrète, suite utile.
- Phrases courtes. Une idée par phrase.

Mots interdits (jamais dans la sortie):
adéquation, fit culturel, soft skills, employabilité, compétences comportementales,
profil non retenu, incompatible, parfaitement, idéalement, excellent signal,
se positionne, marque candidat, faiblesse, mauvais score, échec.

Formulations à éviter:
compatible, adéquat, optimal, profil idéal, candidat parfait, score d'adéquation.

Caractères interdits dans la sortie:
Pas de tiret long (em-dash) ni de tiret demi-cadratin (en-dash).
Remplace par un point ou commence une nouvelle phrase.

Mots et tournures à privilégier:
ce qui colle, ce qui crée un écart, tes points forts, les attentes du poste,
l'ambiance de travail, les missions, ton parcours, cette piste, ce poste, ce que je vois.

Spécificité (règle non négociable):
Si une phrase peut être réutilisée pour une autre offre sans la changer, réécris-la.
Chaque phrase cite un élément précis du candidat ET un élément précis de l'offre.

Interdictions de fond:
- Ne dis jamais que le candidat ne se connaît pas.
- Pas de rassurance vide ("ça va aller", "ne t'inquiète pas").
- Si le score est faible, pas d'encouragement générique. Nomme l'écart, propose une action.
- N'invente pas une culture d'entreprise qui n'est pas visible dans l'offre.`

const analysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Score global de matching entre le profil et le poste'),
  personalityScore: z.number().min(0).max(100).describe('Score personnalité'),
  valuesScore: z.number().min(0).max(100).describe('Score valeurs et environnement de travail'),
  skillsScore: z.number().min(0).max(100).nullable().describe('Score compétences (null si non évaluable)'),

  jobIndustry: z
    .string()
    .nullable()
    .describe(
      'Secteur d\'activité de l\'entreprise/poste, inféré depuis la description de l\'offre (ex: "Fintech", "Conseil en stratégie", "SaaS B2B", "Industrie pharmaceutique", "Édition logicielle", "Médias", "Énergie", "Mode et luxe"). En français, 1 à 4 mots, capitalisation propre. Null UNIQUEMENT si la description est trop maigre pour conclure honnêtement.',
    ),

  personalityAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts personnalité'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention personnalité'),
  }),

  valuesAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts valeurs et environnement de travail'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention valeurs et environnement de travail'),
  }),

  skillsAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts compétences'),
    attentionPoints: z.array(z.string()).describe('Points d\'attention compétences'),
  }).nullable(),

  strengths: z.array(z.string()).describe('Synthèse globale des points forts'),
  attentionPoints: z.array(z.string()).describe('Synthèse globale des points d\'attention'),

  hasDealbreakers: z.boolean().describe('Présence de critères rédhibitoires'),
  dealbreakerDetails: z.array(z.string()).nullable().describe('Détails des critères rédhibitoires'),
})

export type AnalysisResult = z.infer<typeof analysisSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Skills-only analysis — used by /api/analyze-complete to avoid re-running
// the full Claude analysis. Only evaluates technical skills and returns
// skillsScore + skillsAnalysis. overallScore is then recalculated in code.
// ─────────────────────────────────────────────────────────────────────────────

const skillsOnlySchema = z.object({
  skillsScore: z.number().min(0).max(100).describe('Score compétences (0 à 100)'),
  skillsAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts compétences (français, tutoiement)'),
    attentionPoints: z.array(z.string()).describe("Points d'attention compétences (français, tutoiement)"),
  }),
})

export type SkillsOnlyResult = z.infer<typeof skillsOnlySchema>

interface SkillsOnlyParams {
  jobData: JobData
  technicalProfile: TechnicalProfile
  academicProfile?: AcademicProfile | null
}

export async function analyzeSkillsOnly({ jobData, technicalProfile, academicProfile }: SkillsOnlyParams): Promise<SkillsOnlyResult> {
  const desc = jobData.description
  const jobDescription = desc.length > 4000
    ? desc.slice(0, 2000) + '\n\n[...]\n\n' + desc.slice(-2000)
    : desc

  const systemPrompt = `RÔLE
Tu es l'analyste compétences techniques de Feeling.
Tu compares le profil technique du candidat (compétences, expériences, diplôme, école, domaine d'études, séniorité) aux exigences de l'offre.
Tu n'analyses PAS la personnalité, ni les valeurs, ni la culture d'entreprise, ni le salaire, ni le télétravail, ni la motivation.

${feelingEditorialRules}

FILTRES STRUCTURANTS (avant tout scoring)
- Si l'offre demande 5 ans ou plus ET le candidat a moins de 2 ans d'expérience: skillsScore plafonné à 35.
- ESN ou cabinet de conseil: même règle, cap 35 si junior face à une offre senior.
- Si l'offre exige un niveau d'études supérieur à celui du candidat: pénalité de 10 à 20 points sur skillsScore.
- Si l'offre exige un niveau inférieur ou égal: aucune pénalité, aucune mention.
- Bonus de 5 à 10 points si le domaine d'études est directement lié au poste.

SCORING
- skillsScore: 0 à 100. Utilise toute la plage, pas de cluster autour de 50.
- Vérification de cohérence: si le score ne reflète pas les écarts d'expérience et de diplôme identifiés, corrige avant de renvoyer.
- Si skillsScore est inférieur à 40, garde un ton lucide. Ne fais pas sonner le profil comme fort pour ce poste.

SORTIE ATTENDUE
- skillsAnalysis.strengths: 2 à 3 phrases courtes. Chaque phrase cite UNE compétence ou UNE expérience précise du candidat, croisée avec UNE exigence précise de l'offre. Le diplôme et l'école peuvent être cités ici si pertinents.
- skillsAnalysis.attentionPoints: 1 à 2 phrases courtes. Nomme au moins UNE compétence attendue absente ou faible, ou un écart d'expérience ou de diplôme si l'offre l'exige. Jamais une simple paraphrase de l'offre, toujours une interprétation utile.

VÉRIFICATION FINALE (avant de renvoyer)
- Aucun mot interdit dans la sortie.
- Aucun tiret long ni demi-cadratin dans la sortie.
- Chaque phrase est spécifique à ce candidat ET à ce poste.
- Le ton est cohérent avec le score.`

  const userPrompt = `OFFRE:
Intitulé: ${jobData.title}
Entreprise: ${jobData.company}
Lieu: ${jobData.location}
Type de contrat: ${jobData.type}
Politique télétravail: ${jobData.remote}

Description:
${jobDescription}

---

PROFIL TECHNIQUE CANDIDAT:
Compétences: ${technicalProfile.skills.join(', ') || '(aucune renseignée)'}

Expériences:
${technicalProfile.experiences.length > 0
  ? technicalProfile.experiences.map(e =>
      `- ${e.job_title} chez ${e.company_name} (${e.start_date} à ${e.is_current ? "aujourd'hui" : e.end_date ?? ''})${e.main_tasks ? `: ${e.main_tasks}` : ''}`
    ).join('\n')
  : '(aucune renseignée)'}

${academicProfile ? `Parcours académique:
- Niveau: ${academicProfile.education_level.toUpperCase()}
- Diplôme: ${academicProfile.diploma_name}
- École: ${academicProfile.school_name}
- Domaine(s) d'études: ${academicProfile.field_of_study.length > 0 ? academicProfile.field_of_study.join(', ') : '(non renseigné)'}
- Année d'obtention: ${academicProfile.graduation_date}` : 'Parcours académique: non renseigné'}

---

Évalue le fit technique du candidat pour ce poste. Sois honnête. Un score bas vaut mieux qu'un score flatteur mais inexact.`

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: skillsOnlySchema,
    system: systemPrompt,
    prompt: userPrompt,
  })

  return object
}

export async function analyzeJobMatch(profiles: UserProfiles): Promise<AnalysisResult> {
  const { jobData, personality, values, dreamJob, currentSituation, technicalProfile, academicProfile } = profiles

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

  const systemPrompt = `RÔLE
Tu es l'analyste de Feeling, une app française de matching d'offres d'emploi.
Tu compares un profil candidat à une offre et tu produis une analyse courte, honnête et utile.

${feelingEditorialRules}

FILTRES STRUCTURANTS (à vérifier AVANT tout scoring)
Ces filtres écrasent toutes les autres règles.

A. Mismatch contrat:
Si le type de contrat de l'offre ne correspond à aucun job_search_types du candidat:
- overallScore plafonné à 10.
- Mentionner explicitement le mismatch dans attentionPoints global.
- Remplir quand même tous les champs requis, mais reste bref.

B. Écart d'expérience majeur:
Si l'offre demande 5 ans ou plus ET le candidat a moins de 2 ans d'expérience totale:
- overallScore plafonné à 30.
- skillsScore plafonné à 35, quel que soit l'outillage.
- Flag explicite dans skillsAnalysis.attentionPoints.

C. Écart de niveau d'études:
- Si l'offre exige un niveau SUPÉRIEUR au candidat: pénalité de 10 à 20 points sur skillsScore (ou sur valuesScore si pas de profil technique). À signaler.
- Si l'offre exige un niveau INFÉRIEUR ou égal: aucune pénalité, aucune mention.

ANALYSE PRÉLIMINAIRE (raisonnement interne, ne pas restituer)
Identifie:
1. Les 3 soft skills attendues par l'offre.
2. Les 2 valeurs culturelles dominantes (performance, collaboration, innovation, etc.).
3. Les compétences techniques clés et l'expérience attendue.
4. Le niveau et le domaine d'études attendus s'ils sont mentionnés.
5. Les conditions explicites (remote, horaires, pression, management).
6. Le type d'entreprise: ESN/conseil, grand groupe, startup, PME, association, public.
7. Les signaux de sous-texte présents dans l'offre.

Croise chaque point avec le profil candidat AVANT de scorer.

SCORING

personalityScore (0 à 100):
- Croise les soft skills attendues avec les traits du candidat.
- Pondération: rang 1 = 50%, rang 2 = 30%, rang 3 = 20%.
- Chaque trait cité doit être croisé avec un élément précis de CETTE offre.

valuesScore (0 à 100):
- Croise les valeurs du candidat avec la culture perçue.
- ESN ou conseil + candidat valorise "impact_concret" ou "sens_travail": -15 à -25 points.
- Grand groupe + candidat valorise "autonomie" ou "initiatives": -10 à -20 points.
- Politique remote qui ne correspond pas aux préférences du candidat: pénalité forte.
- Pas de mention de remote ET candidat avec préférence remote: -10 points.
- Pas de mention de salaire ET candidat avec range défini: mentionner sans pénalité.
- Secteur clairement éloigné des secteurs cibles: mentionner dans valuesAnalysis.attentionPoints.

skillsScore (0 à 100):
- Expérience requise > expérience candidat: pénalité de 25 à 35 points, non négociable.
- ESN: cap 35 si junior (moins de 2 ans) face à une offre senior (5+ ans).
- Niveau d'études supérieur exigé: pénalité de 10 à 20 points (cf. filtre C).
- Bonus de 5 à 10 points si le domaine d'études est directement lié au poste.

overallScore:
- Avec profil technique: personalityScore × 0.35 + valuesScore × 0.35 + skillsScore × 0.30.
- Sans profil technique: personalityScore × 0.50 + valuesScore × 0.50, skillsScore = null, skillsAnalysis = null.
- Arrondir à l'entier.
- Si dealbreaker détecté: cap 30 après calcul.

Cohérence: si overallScore est inférieur à 40 mais que deux sous-scores sont au-dessus de 60, revois et corrige avant de renvoyer.

DEALBREAKERS
Un dealbreaker est "présent" seulement si:
- Le candidat l'a sélectionné, ET
- L'offre contient un signal clair de ce dealbreaker (lire jusqu'à la fin de la description).

Clés possibles pour dealbreakerDetails:
management_autoritaire, pas_evolution, mauvaise_ambiance, travail_repetitif,
aucune_reconnaissance, manque_sens, forte_pression, pas_feedback, pas_flexibilite, heures_sup.

SÉPARATION DES BLOCS (pas de répétition entre blocs)
- Diplôme et école: uniquement dans skillsAnalysis. Jamais dans valuesAnalysis ni dans le bloc global.
- Traits de personnalité: uniquement dans personalityAnalysis.
- Décodage du type d'entreprise: uniquement dans valuesAnalysis.
- Bloc global (strengths + attentionPoints): NOUVELLE synthèse, jamais une redite des sous-blocs.

DÉCODAGE DU TYPE D'ENTREPRISE (obligatoire, dans valuesAnalysis)
Nomme le type ET interprète ce qu'il implique pour CE candidat précisément.
- ESN ou conseil: missions chez le client, culture facturation, peu d'ownership produit long terme.
- Grand groupe: process lourds, hiérarchie marquée, progression lente mais stable.
- Startup: forte autonomie, incertitude assumée, rythme rapide.
- PME: polyvalence attendue, proximité management.
- Inconnu ou trop petit pour info publique: dis-le, et indique quoi chercher pour se faire un avis.

Jamais juste le nom du type. Toujours l'interprétation pour ce profil.
N'invente pas une culture qui n'est pas visible dans l'offre.

SIGNAUX DE SOUS-TEXTE (à décoder seulement s'ils apparaissent dans l'offre, et toujours pour CE candidat)
- "environnement dynamique" implique pression et rythme soutenu.
- "autonomie dès le départ" implique peu d'onboarding ou de support.
- "expérience significative" implique que les profils juniors ne sont pas souhaités.
- "missions variées" peut signaler un manque de spécialisation.
- Pas de mention de remote implique présentiel attendu. Pénalité de 10 points sur valuesScore si candidat avec préférence remote forte.
- Pas de mention de salaire implique souvent un niveau sous le marché ou une négociation difficile.

RÈGLES DE SORTIE PAR SCORE (ton cohérent avec le palier du score)

Le ton du texte doit coller au palier du score affiché au candidat. 8 paliers (verdict côté front entre parenthèses):

- overallScore ≥ 80 (Bon feeling): ton net et confiant, factuel. Le texte invite clairement à candidater. Jamais flatteur, jamais creux.
- overallScore 75 à 79 (Bon feeling): ton positif et assuré. Cite les points solides précis qui justifient la candidature.
- overallScore 70 à 74 (Bon feeling): ton positif mesuré. Confirme l'alignement et oriente vers le passage à l'action.
- overallScore 60 à 69 (Match partiel): ton chaleureux mais lucide. Reconnaît la base intéressante, nomme les points à vérifier avant de postuler.
- overallScore 50 à 59 (Match partiel): ton réservé. La candidature peut se tenter, mais certains éléments créent un écart réel à nommer.
- overallScore 40 à 49 (Match partiel): ton honnête. Le match reste partiel, le candidat doit cibler sa candidature avec précision.
- overallScore 30 à 39 (Feeling faible): ton lucide, jamais positif. Nomme les écarts importants entre les attentes du poste et le profil actuel.
- overallScore < 30 (Feeling faible): ton direct et honnête. Dis clairement que l'offre n'est pas alignée. Aucune phrase encourageante générique.

Si le texte sonne plus positif que le palier du score, réécris-le.
Si le texte sonne plus négatif que le palier du score, réécris-le.

Bloc global strengths:
- overallScore ≥ 70 (Bon feeling): 2 à 3 phrases courtes et positives, factuelles. Chaque phrase cite un élément précis du profil ET un élément précis de l'offre. Termine par un angle clair à mettre en avant dans la candidature.
- overallScore 40 à 69 (Match partiel): 2 à 3 phrases nuancées. Cite les vrais alignements ET invite le candidat à cibler sa candidature avec soin. Plus le score baisse dans cette plage, plus la réserve est marquée.
- overallScore < 40 (Feeling faible): 1 à 2 phrases factuelles. Pas d'encouragement générique. Nomme la cause principale du score faible. Propose une redirection stratégique (type de poste, niveau de séniorité, type d'entreprise, contrat, localisation ou télétravail à viser).

Bloc global attentionPoints:
- 1 à 3 phrases de synthèse nouvelle. Pas de paraphrase de l'offre. Pas de redite des sous-blocs.
- Le DERNIER attentionPoint contient une action concrète, spécifique, à faire cette semaine.
- Jamais "vérifie sur Glassdoor" comme action seule. Précise toujours quoi chercher et pourquoi.

ANALYSE PARTIELLE (sans profil technique)
Si le profil technique est absent:
- skillsScore = null et skillsAnalysis = null.
- Ajoute une phrase naturelle dans les attentionPoints globaux pour dire que l'analyse ne couvre pas encore les compétences techniques et inviter le candidat à compléter son profil.

VÉRIFICATION FINALE (avant de renvoyer)
- Aucun mot interdit dans la sortie.
- Aucun tiret long ni demi-cadratin dans la sortie.
- Aucune phrase recyclable: chaque phrase est spécifique à ce candidat ET à cette offre.
- Le ton respecte le palier du score parmi les 8 définis (pas de positif quand le score est bas, pas de réserve quand le score est haut).
- Le bloc global ne répète aucun sous-bloc.
- Le dernier attentionPoint global propose une action concrète à faire cette semaine.

TRAITS DOMINANTS DU CANDIDAT (par ordre d'importance):
${rankedTraits || '(aucun sélectionné)'}

${existingTestInfo}`

  // Garde le début et la fin de la description pour ne pas rater les conditions
  // de travail ni les mentions de management souvent placées en fin d'offre.
  const desc = jobData.description
  const jobDescription = desc.length > 4000
    ? desc.slice(0, 2000) + '\n\n[...]\n\n' + desc.slice(-2000)
    : desc

  const userPrompt = `OFFRE:
Intitulé: ${jobData.title}
Entreprise: ${jobData.company}
Lieu: ${jobData.location}
Type de contrat: ${jobData.type}
Politique télétravail: ${jobData.remote}

Description:
${jobDescription}

---

PROFIL CANDIDAT:

Situation actuelle: ${formatSituations(currentSituation)}

Traits de personnalité dominants (classés par importance):
${rankedTraits || '(aucun renseigné)'}
${existingTestInfo}

Valeurs professionnelles principales (jusqu'à 3):
${
  values.selected_values.length > 0
    ? values.selected_values.map((v) => `- ${VALUE_LABELS[v] ?? v}`).join('\n')
    : '(aucune sélectionnée)'
}

Critères rédhibitoires du candidat (jusqu'à 3):
${
  values.dealbreakers.length > 0
    ? values.dealbreakers.map((d) => `- ${DEALBREAKER_LABELS[d] ?? d}`).join('\n')
    : '(aucun)'
}

${academicProfile ? `Parcours académique:
- Niveau d'études: ${academicProfile.education_level.toUpperCase()}
- Diplôme: ${academicProfile.diploma_name}
- École / Institution: ${academicProfile.school_name}
- Domaine(s) d'études: ${academicProfile.field_of_study.length > 0 ? academicProfile.field_of_study.join(', ') : '(non renseigné)'}
- Année d'obtention: ${academicProfile.graduation_date}` : "Parcours académique: non renseigné (ne pas évaluer le niveau d'études)"}

${dreamJob ? `Critères de recherche:
- Poste(s) cible(s): ${dreamJob.job_titles.length > 0 ? dreamJob.job_titles.join(', ') : '(non renseigné)'}
- Localisation(s) préférée(s): ${dreamJob.locations.length > 0 ? dreamJob.locations.join(', ') : '(non renseigné)'}
- Rayon de recherche: ${dreamJob.location_radius === 0 ? 'Sans préférence' : `${dreamJob.location_radius} km`}
- Secteurs cibles: ${dreamJob.industries.length > 0 ? dreamJob.industries.join(', ') : '(non renseigné)'}
- Salaire attendu: ${dreamJob.salary_range ?? '(non renseigné)'}
- Préférence télétravail: ${dreamJob.remote_preference ?? '(non renseigné)'}
Si la politique télétravail ou le salaire de l'offre ne correspondent clairement pas aux préférences du candidat, applique une pénalité significative sur valuesScore et mentionne-le dans valuesAnalysis.attentionPoints (en français).` : ''}

${technicalProfile ? `Profil technique:
Compétences: ${technicalProfile.skills.join(', ')}

Expériences:
${technicalProfile.experiences.map(e => `- ${e.job_title} chez ${e.company_name} (${e.start_date} à ${e.is_current ? "aujourd'hui" : e.end_date ?? ''})${e.main_tasks ? `: ${e.main_tasks}` : ''}`).join('\n')}` : "Profil technique: non renseigné (ne pas évaluer les compétences techniques, renvoyer skillsScore = null et skillsAnalysis = null)"}

---

Applique d'abord tous les filtres structurants.
Ensuite, analyse cette offre face au profil candidat en suivant les étapes du system prompt.
Prends en compte la ou les situations actuelles du candidat (plusieurs combinaisons possibles, ex: "en poste" ET "cherche un CDI") et adapte les recommandations en conséquence.
Vérifie les dealbreakers dans toute la description, jusqu'à la fin.
${technicalProfile
  ? "Évalue à la fois le fit compétences ET le parcours académique face aux exigences de l'offre."
  : "N'évalue pas les compétences techniques (skillsScore = null, skillsAnalysis = null). Intègre le parcours académique dans valuesScore si pertinent. Ajoute une phrase dans attentionPoints global pour dire au candidat que l'analyse est partielle et l'inviter à compléter son profil technique."}
Sois honnête et nuancé. Un score bas vaut mieux qu'un score flatteur mais inexact.

CONTRAINTES STRICTES DE SORTIE:
- Toutes les chaînes de sortie sont en français, tutoiement.
- Aucun tiret long ni demi-cadratin nulle part. Remplace par un point ou une nouvelle phrase.
- Aucun mot interdit (voir règles éditoriales).

- personalityAnalysis.strengths: 2 à 3 phrases. Chaque phrase cite un trait précis du candidat ET un élément précis de CETTE offre. Aucune phrase ne doit pouvoir s'appliquer à une autre offre.
- personalityAnalysis.attentionPoints: 1 à 2 phrases sur une friction psychologique réelle entre le profil et les demandes spécifiques du poste. Pas de paraphrase de l'offre.

- valuesAnalysis.strengths: 2 à 3 phrases sur l'alignement des valeurs ET le décodage du type d'entreprise pour ce candidat. Jamais de diplôme ou d'école ici.
- valuesAnalysis.attentionPoints: 1 à 2 phrases sur les écarts (valeurs, remote, salaire, secteur). Décode tout sous-texte pertinent. Jamais de diplôme ici.

- skillsAnalysis.strengths (si profil technique fourni): 2 à 3 phrases citant au moins UNE compétence ou expérience précise du candidat face à UNE exigence précise de l'offre. Diplôme et école peuvent y figurer si pertinents.
- skillsAnalysis.attentionPoints (si profil technique fourni): 1 à 2 phrases nommant au moins UNE compétence absente ou faible, ou un écart académique si l'offre l'exige.

- strengths (bloc global):
  Si overallScore ≥ 40: 2 à 3 phrases courtes, nouvelle synthèse. Chaque phrase cite un élément précis du profil ET un élément précis de l'offre. Zéro phrase générique.
  Si overallScore < 40: 1 à 2 phrases factuelles. Pas d'encouragement générique. Nomme la cause principale du score faible. Propose une redirection stratégique (type d'entreprise, niveau, contrat, localisation ou télétravail à viser).

- attentionPoints (bloc global): 1 à 3 phrases de synthèse nouvelle. Pas de jargon. Pas de paraphrase de l'offre. Pas de redite des sous-blocs. Le DERNIER attentionPoint propose une action concrète et spécifique à faire cette semaine.

- jobIndustry: déduis le secteur de l'entreprise/poste depuis l'offre (nom de l'entreprise, vocabulaire, produit, cible). 1 à 4 mots en français, capitalisation propre (ex: "Fintech", "SaaS B2B", "Conseil en stratégie", "Industrie pharmaceutique", "Édition logicielle", "Médias", "Énergie", "Mode et luxe", "Édutech", "E-commerce"). Une étiquette de secteur reconnaissable, pas une famille de métier. Null UNIQUEMENT si la description est trop maigre pour conclure honnêtement.`

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: analysisSchema,
    system: systemPrompt,
    prompt: userPrompt,
  })

  if (!object) {
    throw new Error('Failed to generate analysis')
  }

  // Apply dealbreaker cap
  let result = object
  if (result.hasDealbreakers && result.overallScore > 30) {
    result = {
      ...result,
      overallScore: 30,
    }
  }

  return result
}
