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
FORBIDDEN CHARACTERS: never use — or – (em-dash or en-dash). Use a period or new sentence instead.
FORBIDDEN WORDS: adéquation, fit culturel, soft skills, employabilité, incompatible, parfaitement, idéalement.

STRUCTURAL FILTERS (apply before scoring):
- If the listing requires 5+ years of experience AND the candidate has less than 2 years: skillsScore MUST be capped at 35, regardless of tool alignment.
- For ESN/consulting firms: if candidate is junior (under 2 years) and the role requires 5+ years, cap skillsScore at 35.
- If the listing requires a higher education level than the candidate's: apply a 10–20 point penalty on skillsScore.
- If the listing requires a lower level than the candidate's: no penalty, no mention.

SCORING RULES:
- skillsScore: 0–100. Be realistic — use the full range, do not cluster around 50.
- Experience gap (required > candidate): mandatory penalty of 25–35 points, non-negotiable.
- Field of study bonus: +5 to +10 points if directly relevant to the role.
- COHERENCE CHECK: if the resulting skillsScore seems inconsistent with the experience and education gaps identified, review and correct before returning.

OUTPUT FORMAT (strict):
- skillsAnalysis.strengths: 2–3 sentences in French. Each must cite at least ONE specific skill or experience from the candidate matched against ONE specific requirement from the listing. Diploma and school may be mentioned here if relevant.
- skillsAnalysis.attentionPoints: 1–2 sentences in French. Must name at least ONE expected skill that is absent or weak, or an experience/academic gap if the listing requires it. Never rephrase the listing — add interpretation.`,
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
STEP 0 — STRUCTURAL FILTERS (check BEFORE any scoring)
═══════════════════════════════════════════
These filters override all other scoring rules.

FILTER A — Contract type mismatch:
If the listing's contract type does not match ANY of the candidate's job_search_types (e.g. listing is apprenticeship/alternance but candidate seeks CDI/CDD, or vice versa):
→ Set overallScore to 10 maximum.
→ Explain the mismatch explicitly in global attentionPoints (in French).
→ Still produce all required output fields but keep the analysis brief.

FILTER B — Major experience gap:
If the listing requires 5 or more years of experience AND the candidate has less than 2 years of total work experience:
→ Set overallScore to 30 maximum.
→ Set skillsScore to 35 maximum regardless of tool or skill alignment.
→ Flag this explicitly in skillsAnalysis.attentionPoints.

FILTER C — Education level gap:
If the listing requires a HIGHER education level than the candidate's: apply a 10–20 point penalty on skillsScore (or on valuesScore if no technical profile is provided). Flag in reasoning.
If the listing requires a LOWER level than the candidate's: no penalty, no mention.

═══════════════════════════════════════════
STEP 1 — PRELIMINARY ANALYSIS (internal reasoning only, do not output)
═══════════════════════════════════════════
Before scoring, explicitly identify:
1. The 3 main soft skills expected by the listing
2. The 2 dominant cultural values of the company (e.g. performance, collaboration, innovation)
3. The key technical skills required and the years of experience expected
4. The expected education level and field (if mentioned)
5. Explicit working conditions (remote policy, hours, pressure, management style)
6. The company type: ESN/consulting, grand groupe, startup, PME, association, or public sector
7. Subtext signals present in the listing (see STEP 5 for decoding rules)
Then cross each point with the candidate's profile before computing scores.

═══════════════════════════════════════════
STEP 2 — SCORING RULES
═══════════════════════════════════════════
PERSONALITY SCORE (personalityScore):
- Identify the soft skills expected by the listing
- Cross them with the candidate's traits using: rank 1 = 50%, rank 2 = 30%, rank 3 = 20%
- Each trait must be crossed with a SPECIFIC element of THIS listing, never generically

VALUES SCORE (valuesScore):
- Cross the candidate's values with the perceived company culture
- Apply the following mandatory adjustments:
  • ESN/consulting firm + candidate values "impact concret" or "sens_travail": -15 to -25 points
  • Grand groupe + candidate values "autonomie" or "initiatives": -10 to -20 points
  • Listing remote policy clearly incompatible with candidate's remote preference: significant penalty
  • Listing does NOT mention remote AND candidate has a strong remote preference: -10 points
  • Listing does NOT mention salary AND candidate has a defined salary range: mention in attentionPoints only, no score penalty
  • Listing sector clearly different from candidate's target industries: mention in valuesAnalysis.attentionPoints

SKILLS SCORE (skillsScore):
- If experience required > candidate's total experience: mandatory penalty of 25–35 points, non-negotiable
- For ESN specifically: cap skillsScore at 35 if candidate is junior (under 2 years) vs a senior role (5+ years required)
- Education gap: 10–20 point penalty if listing requires higher level than candidate's (from FILTER C)
- Field of study bonus: +5 to +10 points if field is directly relevant to the role

OVERALL SCORE (overallScore):
- With technical profile    : overallScore = personalityScore × 0.35 + valuesScore × 0.35 + skillsScore × 0.30
- Without technical profile : overallScore = personalityScore × 0.50 + valuesScore × 0.50
- Round to the nearest integer
- If a dealbreaker is detected: cap at 30/100 (applied after calculation)
- COHERENCE CHECK: if overallScore < 40 but two sub-scores are above 60, review and correct the sub-scores to resolve the inconsistency before returning

PARTIAL ANALYSIS — when technical profile is absent:
You MUST include a sentence in the global attentionPoints (in French) informing the candidate that the analysis is partial and inviting them to complete their technical profile.
Example (adapt freely): "Cette analyse ne couvre pas encore tes compétences techniques — complète ton profil pour obtenir un score plus précis."

GENERAL CONSTRAINTS:
- Scores must be realistic and differentiated (not all around 50%)
- Use the full 0–100 range
- A score below 40 is valid and must be given when the profile does not match

═══════════════════════════════════════════
STEP 3 — DEALBREAKER DETECTION
═══════════════════════════════════════════
A dealbreaker is "present" ONLY if it is both selected by the candidate AND actually observed in the listing (including the end of the description).

POSSIBLE DEALBREAKERS (keys for dealbreakerDetails):
- management_autoritaire, pas_evolution, mauvaise_ambiance, travail_repetitif,
  aucune_reconnaissance, manque_sens, forte_pression, pas_feedback, pas_flexibilite, heures_sup

═══════════════════════════════════════════
STEP 4 — EDITORIAL RULES (strictly enforced)
═══════════════════════════════════════════
FORBIDDEN WORDS — never use any of these, in any form:
adéquation, fit culturel, soft skills, employabilité, compétences comportementales,
profil non retenu, incompatible, parfaitement, idéalement, excellent signal,
se positionne, marque candidat.

FORBIDDEN CHARACTERS: the characters — and –
Replace with a period or start a new sentence. Never use em-dash or en-dash.

VERDICT MAPPING (strict, no exceptions):
- overallScore > 65  → "Bon feeling"
- overallScore 40–65 → "Match partiel"
- overallScore < 40  → "Feeling faible"

NO REPHRASING THE LISTING:
Every attention point must contain an interpretation the candidate cannot make alone by reading the listing.
Never write a sentence that simply restates visible information from the listing.

BLOCK SEPARATION RULES (no cross-block repetition):
- Diploma and school name: appear ONLY in skillsAnalysis, never in valuesAnalysis or global block
- Personality traits: appear ONLY in personalityAnalysis
- Company type decoding: appears ONLY in valuesAnalysis
- Global block (strengths + attentionPoints): must bring a NEW synthesis — never repeat what the sub-blocks already said

GLOBAL BLOCK RULES BY SCORE:
- overallScore > 65  : synthesis of the strongest alignment points + one action to strengthen the application
- overallScore 40–65 : balanced synthesis of strengths and gaps + one concrete action
- overallScore < 40  : ZERO generic encouraging statements. Name explicitly what causes the low score. Provide a strategic redirection (type of company, level of role, contract type, geography or remote to target instead). End with ONE concrete specific action for this week.

═══════════════════════════════════════════
STEP 5 — VALUE-ADD RULES
═══════════════════════════════════════════
COMPANY TYPE DECODING (mandatory for every analysis, in valuesAnalysis):
Identify the company type and explain what it concretely implies for THIS specific candidate.
Never just name the type. Always interpret it in relation to the candidate's specific values.
- ESN/consulting: missions at client sites, billing culture, little long-term product ownership
- Grand groupe: heavy processes, strong hierarchy, slow advancement
- Startup: strong autonomy, assumed uncertainty, fast pace
- PME: expected versatility, proximity to management
- Unknown or too small for public info: say so and suggest how the candidate can find this information

SUBTEXT SIGNALS (decode every relevant phrase found in the listing, for THIS candidate specifically):
- "environnement dynamique" → high pressure and sustained pace
- "autonomie dès le départ" → little onboarding or support
- "expérience significative" → junior profiles not desired
- "missions variées" → may mean lack of specialization
- No mention of remote → on-site presence likely expected; apply -10 on valuesScore if candidate has remote preference
- No mention of salary → often below market; mention in attentionPoints if candidate has a defined range
Always explain what the subtext means for THIS specific candidate.

CONCRETE ACTIONS (mandatory rules):
- Never write "vérifie sur Glassdoor" as a standalone action
- Every suggested action must specify WHAT to look for AND WHY it matters for this candidate
- Example: "Avant de postuler, recherche les avis salariés [Entreprise] sur la fréquence des déplacements chez le client pour vérifier si c'est compatible avec ton besoin d'impact produit."
- When overallScore < 40: global attentionPoints MUST end with ONE concrete and specific action the candidate can take this week

KNOWN COMPANY CULTURE:
- If the company is well-known, use available knowledge about its culture, management style, and HR practices to enrich valuesAnalysis
- If the company is unknown or too small, say so explicitly

═══════════════════════════════════════════
STEP 4 — REAL VALUE MECHANISMS (mandatory)
═══════════════════════════════════════════
Every analysis must contain at least ONE insight 
the candidate could NOT get by reading the offer.

MECHANISM 1 — COMPANY TYPE DECODER:
Identify the company type and explain concretely 
what it means for this candidate:
- ESN / cabinet de conseil: missions chez le client, 
  peu de vision produit long terme, culture facturation, 
  changement fréquent de contexte
- Startup / scale-up: forte autonomie, produit en 
  construction, incertitude assumée
- Grand groupe: process lourds, hiérarchie forte, 
  évolution lente mais stable
- PME: polyvalence attendue, peu de spécialisation

Never just name the type. Always interpret what it 
means specifically for this candidate's values and profile.

MECHANISM 2 — EXPERIENCE GAP DECODER:
If required experience > candidate's actual experience:
- Explain concretely what this gap means in practice
- Explain why tools match is not sufficient to compensate
- Suggest ONE alternative type of offer to target
- If candidate should still apply despite the gap, 
  explain exactly what to highlight in cover letter
- Example (adapt freely):
  "Cette offre cible un profil senior. Dans une ESN, 
  l'expérience est le critère de facturation principal. 
  Ton profil junior sera plus crédible sur des offres 
  qui mentionnent 'première expérience' ou '0 à 2 ans'."

MECHANISM 3 — COMPANY CULTURE ENRICHMENT:
Use your knowledge of the company to add information 
the candidate cannot read in the offer:
- Known culture and management style
- Known employee experience if major company
- Typical profile recruited
If the company is unknown, flag it explicitly 
and suggest what to look for and what questions 
to ask in interview.

MECHANISM 4 — OFFER SUBTEXT DECODER:
Read between the lines and flag ambiguous formulations:
- "environnement dynamique" → pression forte 
  et rythme soutenu
- "autonomie attendue dès le départ" → peu 
  d'accompagnement et d'onboarding structuré
- "expérience significative" → profil junior 
  non souhaité
- "missions variées" → peut signifier manque 
  de spécialisation
- Absence of remote mention → présentiel 
  probablement attendu
- Absence of salary mention → souvent en dessous 
  du marché ou négociation difficile

Always explain what the subtext means for THIS 
candidate specifically, not in general.

MECHANISM 5 — STRATEGIC REDIRECT:
Mandatory when overallScore < 40.
Based on the candidate's profile, suggest:
- What type of company would be more aligned
- What seniority level or contract type to target
- What geographic or remote filter to apply
- ONE specific action the candidate can take this week

Never say "cherche sur Glassdoor" as standalone action.
Always be specific about what to look for and why.

COHERENCE RULE (mandatory):
If overallScore < 40, the global strengths block 
MUST NOT contain encouraging statements that 
contradict the low score.
Instead: name explicitly what causes the low score 
and suggest ONE concrete action.

SIGNAL PRIORITY RULE:
If a geographic mismatch is detected, this MUST 
be the first attention point in valuesAnalysis.
Same rule applies for experience gap.

VALUES BLOCK RULE:
valuesAnalysis must focus on company culture, 
work environment, company type dynamic, 
management style and sector fit.
Academic background belongs in skillsAnalysis only.
Do NOT mention degree or school in valuesAnalysis 
unless directly linked to a cultural fit point.

NEVER STATE THE OBVIOUS RULE:
Never include something the candidate can already 
read in the offer without interpretation:
- Location mismatch: explain what it implies 
  and what to do, not just state it
- Salary range: only mention if creates real mismatch
- Contract type: only mention if conflicts with 
  candidate's search criteria
Every sentence must add interpretation, 
not just repeat information from the listing.

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

Apply all STEP 0 structural filters first.
Then analyze this job listing against the candidate's profile following STEPS 1 through 5.
Account for the candidate's current situation(s) — they may combine several (e.g. "employed" AND "seeking a CDI") — and tailor recommendations accordingly.
Check for dealbreakers throughout the entire description, including the end.
${technicalProfile
  ? 'Evaluate both technical skill fit AND academic background against the job requirements.'
  : 'Do not evaluate technical skills (skillsScore = null, skillsAnalysis = null). Factor in academic background within valuesScore where relevant. You MUST include a sentence in global attentionPoints (in French) telling the candidate the analysis is partial and inviting them to complete their technical profile.'}
Be honest and nuanced. A low score is better than a flattering but inaccurate one.

STRICT OUTPUT FORMAT CONSTRAINTS (DO NOT IGNORE):
- All output strings must be written in French using "tu" (informal).
- No em-dash or en-dash (— or –) anywhere in output. Use a period or new sentence instead.
- No forbidden words: adéquation, fit culturel, soft skills, employabilité, compétences comportementales, profil non retenu, incompatible, parfaitement, idéalement, excellent signal, se positionne, marque candidat.

- personalityAnalysis.strengths: exactly 2–3 sentences. Each must cite a specific trait of the candidate AND a specific element of THIS listing. No sentence must apply to any other job offer.
- personalityAnalysis.attentionPoints: exactly 1–2 sentences on genuine psychological friction between the candidate's profile and this role's specific demands. Never rephrase the listing.

- valuesAnalysis.strengths: exactly 2–3 sentences on values alignment AND company type decoding for this candidate. Never mention diploma or school here.
- valuesAnalysis.attentionPoints: exactly 1–2 sentences on mismatches (values, remote, salary, sector gap). Decode any subtext signals relevant to this candidate. Never mention diploma here.

- skillsAnalysis.strengths (if technical profile provided): 2–3 sentences citing at least ONE specific skill or experience from the candidate vs ONE specific requirement from the listing. Diploma and school may be mentioned here if relevant.
- skillsAnalysis.attentionPoints (if technical profile provided): 1–2 sentences naming at least ONE missing or weak skill, or an academic gap if the listing requires it.

- strengths (global list): exactly 2–3 short sentences bringing a NEW synthesis not already said in sub-blocks.
  > MANDATORY: each sentence must cite at least ONE specific element from the candidate profile AND ONE from the listing. Zero generic statements.
  > overallScore > 65: highlight strongest alignment points + one action to strengthen the application.
  > overallScore 40–65: balance strengths and gaps + one concrete action.
  > overallScore < 40: name explicitly what causes the low score. Provide strategic redirection (company type, role level, contract, geography/remote to target instead). End with ONE concrete action for this week.

- attentionPoints (global list): 1–3 sentences of new global synthesis. No jargon, no rephrasing the listing. No repetition of sub-block content.
  > overallScore < 40: must end with one concrete and specific action the candidate can take this week.

- jobIndustry: infer the company/job sector from the listing description (company name, vocabulary, products, target market). 1 to 4 words in French, properly capitalized (e.g. "Fintech", "SaaS B2B", "Conseil en stratégie", "Industrie pharmaceutique", "Édition logicielle", "Médias", "Énergie", "Mode et luxe", "Édutech", "E-commerce"). Use a recognized sector label, not a job family. Set to null ONLY if the description is too thin to conclude honestly.`

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
