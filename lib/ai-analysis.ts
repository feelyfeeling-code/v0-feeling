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

// ─────────────────────────────────────────────────────────────────────────────
// Skills-only analysis — used by /api/analyze-complete to avoid re-running
// the full Claude analysis. Only evaluates technical skills and returns
// skillsScore + skillsAnalysis. overallScore is then recalculated in code.
// ─────────────────────────────────────────────────────────────────────────────

const skillsOnlySchema = z.object({
  skillsScore: z.number().min(0).max(100).describe('Technical skills compatibility score'),
  skillsAnalysis: z.object({
    strengths: z.array(z.string()).describe('Points forts compétences (en français, tutoiement)'),
    attentionPoints: z.array(z.string()).describe("Points d'attention compétences (en français, tutoiement)"),
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

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: skillsOnlySchema,
    system: `You are a technical skills compatibility analyst for the French job-matching app Feeling.
Your sole task is to evaluate how well a candidate's technical skills and work experience match a job listing.

IMPORTANT: All output strings (strengths, attentionPoints) MUST be written in French using "tu" (informal you).

SCORING RULES:
- skillsScore: 0–100. Be realistic — use the full range, do not cluster around 50.
- Apply a 10–20 point penalty if the listing requires a higher education level than the candidate's.
- Apply a 5–10 point bonus if the candidate's field of study is directly relevant to the role.

OUTPUT FORMAT (strict):
- skillsAnalysis.strengths: 2–3 sentences in French. Each must cite at least ONE specific skill or experience from the candidate matched against ONE specific requirement from the listing.
- skillsAnalysis.attentionPoints: 1–2 sentences in French. Must name at least ONE expected skill that is absent or weak in the candidate's profile, or an academic gap if the listing requires it.`,
    prompt: `JOB LISTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Contract type: ${jobData.type}
Remote policy: ${jobData.remote}

Description:
${jobDescription}

---

CANDIDATE TECHNICAL PROFILE:
Skills: ${technicalProfile.skills.join(', ') || '(none listed)'}

Work experiences:
${technicalProfile.experiences.length > 0
  ? technicalProfile.experiences.map(e =>
      `- ${e.job_title} at ${e.company_name} (${e.start_date} – ${e.is_current ? 'present' : e.end_date ?? ''})${e.main_tasks ? `: ${e.main_tasks}` : ''}`
    ).join('\n')
  : '(none listed)'}

${academicProfile ? `Academic background:
- Education level: ${academicProfile.education_level.toUpperCase()}
- Degree: ${academicProfile.diploma_name}
- School: ${academicProfile.school_name}
- Field(s) of study: ${academicProfile.field_of_study.length > 0 ? academicProfile.field_of_study.join(', ') : '(not provided)'}
- Graduation year: ${academicProfile.graduation_date}` : 'Academic background: not provided'}

---

Evaluate the candidate's technical fit for this role. Be honest — a low score is better than a flattering but inaccurate one.`,
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

  const systemPrompt = `You are an expert job-candidate compatibility analyst for the French app Feeling.
You analyze job listings and assess their fit with a candidate's psychological profile, values, academic background, and technical skills.

IMPORTANT: All output text visible to the candidate MUST be written in French, using "tu" (informal you). This applies to every string in strengths, attentionPoints, personalityAnalysis, valuesAnalysis, and skillsAnalysis.

═══════════════════════════════════════════
STEP 1 — PRELIMINARY ANALYSIS (internal reasoning only, do not output)
═══════════════════════════════════════════
Before scoring, explicitly identify:
1. The 3 main soft skills expected by the job listing
2. The 2 dominant cultural values of the company (e.g. performance, collaboration, innovation…)
3. The key technical skills required
4. The expected education level and field (if mentioned)
5. Explicit working conditions (remote policy, hours, pressure, management style)
Then cross each of these points with the candidate's profile before computing scores.

═══════════════════════════════════════════
STEP 2 — SCORING RULES
═══════════════════════════════════════════
PERSONALITY SCORE (personalityScore):
- Identify the soft skills expected by the listing
- Cross them with the candidate's traits using the following weights: rank 1 = 50%, rank 2 = 30%, rank 3 = 20%

VALUES SCORE (valuesScore):
- Cross the candidate's values with the perceived company culture
- Apply a significant penalty if the candidate's remote_preference or salary_range is clearly incompatible with the offer

ACADEMIC SCORE — integrated into valuesScore or skillsScore:
- If the listing requires a higher education level than the candidate's: apply a 10–20 point penalty on skillsScore (or valuesScore if no technical profile)
- If the candidate's field of study is directly relevant to the role: apply a 5–10 point bonus
- If the level is sufficient but the field is unrelated: mention in attentionPoints only

OVERALL SCORE (overallScore):
- With technical profile    : overallScore = personalityScore × 0.35 + valuesScore × 0.35 + skillsScore × 0.30
- Without technical profile : overallScore = personalityScore × 0.50 + valuesScore × 0.50
- Round to the nearest integer
- If a dealbreaker is detected: overall score MUST be capped at 30/100 (applied after calculation)

PARTIAL ANALYSIS — when technical profile is absent:
- The analysis only covers personality and values dimensions
- You MUST include a sentence in the global attentionPoints (in French, using "tu") informing the candidate that the analysis is partial and inviting them to complete their technical profile for a more accurate result
- Example (adapt freely): "Cette analyse ne prend pas encore en compte tes compétences techniques — complète ton profil technique pour obtenir un score plus précis."

GENERAL CONSTRAINTS:
- Scores must be realistic and differentiated (not all around 50%)
- Use the full 0–100 range
- A score below 40 is valid and should be given when the profile does not match

═══════════════════════════════════════════
STEP 3 — DEALBREAKER DETECTION
═══════════════════════════════════════════
A dealbreaker is "present" ONLY if it is both selected by the candidate AND actually observed in the listing (including the end of the description).

POSSIBLE DEALBREAKERS (keys for dealbreakerDetails):
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

CANDIDATE'S DOMINANT PERSONALITY TRAITS:
${rankedTraits || '(none selected)'}

${existingTestInfo}`

  // Fix troncature : garder début + fin pour ne pas rater les conditions de travail et mentions de management
  const desc = jobData.description
  const jobDescription = desc.length > 4000
    ? desc.slice(0, 2000) + '\n\n[...]\n\n' + desc.slice(-2000)
    : desc

  const userPrompt = `JOB LISTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Contract type: ${jobData.type}
Remote policy: ${jobData.remote}

Description:
${jobDescription}

---

CANDIDATE PROFILE:

Current situation(s): ${formatSituations(currentSituation)}

Dominant personality traits (ranked by importance):
${rankedTraits || '(none provided)'}
${existingTestInfo}

Top professional values (up to 3):
${
  values.selected_values.length > 0
    ? values.selected_values.map((v) => `- ${VALUE_LABELS[v] ?? v}`).join('\n')
    : '(none selected)'
}

Candidate's dealbreakers (up to 3):
${
  values.dealbreakers.length > 0
    ? values.dealbreakers.map((d) => `- ${DEALBREAKER_LABELS[d] ?? d}`).join('\n')
    : '(none)'
}

${academicProfile ? `Academic background:
- Education level: ${academicProfile.education_level.toUpperCase()}
- Degree: ${academicProfile.diploma_name}
- School / Institution: ${academicProfile.school_name}
- Field(s) of study: ${academicProfile.field_of_study.length > 0 ? academicProfile.field_of_study.join(', ') : '(not provided)'}
- Graduation year: ${academicProfile.graduation_date}` : 'Academic background: not provided (do not evaluate education level)'}

${dreamJob ? `Job search criteria:
- Target role(s): ${dreamJob.job_titles.length > 0 ? dreamJob.job_titles.join(', ') : '(not provided)'}
- Preferred location(s): ${dreamJob.locations.length > 0 ? dreamJob.locations.join(', ') : '(not provided)'}
- Search radius: ${dreamJob.location_radius === 0 ? 'No preference' : `${dreamJob.location_radius} km`}
- Target industries: ${dreamJob.industries.length > 0 ? dreamJob.industries.join(', ') : '(not provided)'}
- Expected salary range: ${dreamJob.salary_range ?? '(not provided)'}
- Remote preference: ${dreamJob.remote_preference ?? '(not provided)'}
⚠️ If the listing's remote policy or salary is clearly incompatible with the candidate's preferences, apply a significant penalty on valuesScore and mention it in valuesAnalysis.attentionPoints (in French).` : ''}

${technicalProfile ? `Technical profile:
Skills: ${technicalProfile.skills.join(', ')}

Work experiences:
${technicalProfile.experiences.map(e => `- ${e.job_title} at ${e.company_name} (${e.start_date} – ${e.is_current ? 'present' : e.end_date ?? ''})${e.main_tasks ? `: ${e.main_tasks}` : ''}`).join('\n')}` : 'Technical profile: not provided (do not evaluate technical skills — return skillsScore as null and skillsAnalysis as null)'}

---

Analyze this job listing against the candidate's profile.
Provide personalized, actionable insights.
Account for the candidate's current situation(s) — they may combine several (e.g. "employed" AND "seeking a CDI") — and tailor recommendations accordingly.
Check for dealbreakers throughout the entire description, including the end.
${technicalProfile
  ? 'Evaluate both technical skill fit AND academic background against the job requirements.'
  : 'Do not evaluate technical skills (skillsScore = null, skillsAnalysis = null). Factor in academic background within valuesScore where relevant. You MUST include a sentence in global attentionPoints (in French) telling the candidate the analysis is partial and inviting them to complete their technical profile.'}
Be honest and nuanced. A low score is better than a flattering but inaccurate one.

STRICT OUTPUT FORMAT CONSTRAINTS (DO NOT IGNORE):
- All output strings must be written in French using "tu" (informal).
- personalityAnalysis.strengths: exactly 2–3 sentences grounded in the candidate's dominant traits AND the soft skills identified in the listing.
- personalityAnalysis.attentionPoints: exactly 1–2 sentences on psychological friction points between the candidate's profile and the role's demands.
- valuesAnalysis.strengths: exactly 2–3 sentences crossing the candidate's values with the perceived company culture. If academic background is relevant (aligned field, recognized school in the sector), mention it here.
- valuesAnalysis.attentionPoints: exactly 1–2 sentences on mismatches (values, remote, salary, or academic level if insufficient).
- skillsAnalysis.strengths (if technical profile provided): 2–3 sentences citing at least ONE specific skill or experience from the candidate matched against ONE specific requirement from the listing.
- skillsAnalysis.attentionPoints (if technical profile provided): 1–2 sentences naming at least ONE expected skill that is absent or weak, or an academic gap if the listing requires it.
- strengths (global list): exactly 2–3 short sentences.
  > MANDATORY: each sentence must reference at least ONE specific element from the candidate profile (trait, value, degree, experience, skill) AND at least ONE specific element from the listing (mission, sector, tech, contract type). No generic statements.
  > If overall score < 40: explicitly name the dimension(s) causing the low score, remain encouraging, and suggest ONE concrete action.
- attentionPoints (global list): 1–3 sentences on global watch points. No jargon, no paraphrasing the listing.

FORBIDDEN WORDS (never use in any output string):
"adéquation", "parfaitement", "idéalement", 
"correspond parfaitement", "te positionne", 
"soft skills", "fit culturel", "employabilité",
"profil non retenu", "incompatible"

FEELY'S VOICE — mandatory for all output strings:
- Start each analysis block with what Feely observed, 
  not with a generic statement
- Use "J'ai regardé", "Ce que je vois", "Honnêtement"
- Never repeat the same information across blocks
- Values block must explain WHY the score is low 
  if below 40, with a concrete next action
- Global strengths must never repeat 
  what's already said in sub-blocks
- "Bon feeling" verdict is only valid above 65%
  Below 65%: use "Match partiel" with a clear explanation

EDITORIAL STRUCTURE (mandatory for every block):
1. Ce que j'observe (result)
2. Pourquoi (concrete reason linked to profile + offer)
3. Ce que tu peux faire ensuite (action)
TYPOGRAPHY RULES (mandatory):
- Never use em dashes "—" or en dashes "–" in any output string
- Use a period or a new sentence instead
- Example: 
  ❌ "C'est un bon signal — mais quelques points méritent attention."
  ✅ "C'est un bon signal mais quelques points méritent quand même ton attention."`

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
