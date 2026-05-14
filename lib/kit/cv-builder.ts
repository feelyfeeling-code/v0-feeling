/**
 * CV builder — étape 1 (déterministe) : construit un CV brut à partir des
 * données d'onboarding. Étape 2 (lib/kit/ai-cv-enricher.ts) : Claude enrichit
 * narrativement (headline, summary, bullets d'expériences, soft skills,
 * classement des compétences par pertinence).
 */

export interface CVData {
  identity: {
    fullName: string
    email: string | null
    location: string | null
  }
  /** Phrase de positionnement (1 ligne, idéalement enrichie par l'IA). */
  headline: string
  /** Paragraphe profil (3-4 phrases). */
  summary: string
  experiences: Array<{
    jobTitle: string
    companyName: string
    location: string | null
    startDate: string
    endDate: string | null
    isCurrent: boolean
    /**
     * Missions reformulées. Après enrichissement IA : 2-4 puces "- ..." sur
     * lignes séparées. Avant enrichissement : main_tasks brut.
     */
    mainTasks: string | null
  }>
  education: Array<{
    level: string
    diploma: string
    school: string
    fields: string[]
    graduationDate: string
  }>
  /** Compétences — liste plate. */
  skills: string[]
  /**
   * Qualités dérivées des traits dominants + valeurs (3-6 entrées).
   * Vide tant que l'enrichissement IA n'a pas tourné.
   */
  softSkills: string[]
  /** Centres d'intérêt — éditable par l'utilisateur, vide par défaut. */
  interests: string[]
  /** Langues — éditable par l'utilisateur, vide par défaut. */
  languages: string[]
}

interface BuildCVParams {
  profile: { first_name: string | null; last_name: string | null; email: string | null }
  academic: {
    education_level: string
    graduation_date: string
    diploma_name: string
    school_name: string
    field_of_study: string[]
  } | null
  experiences: Array<{
    job_title: string
    company_name: string
    location: string | null
    start_date: string
    end_date: string | null
    is_current: boolean
    main_tasks: string | null
  }>
  skills: string[]
  dreamJob: { job_titles: string[]; locations: string[] } | null
  job: {
    title: string | null
    description: string | null
    location: string | null
  }
}

export const VALUE_LABELS: Record<string, string> = {
  impact_concret: 'Impact concret',
  ambiance_equipe: "Bonne ambiance d'équipe",
  horaires_flexibles: 'Flexibilité horaire',
  apprendre_continu: 'Apprentissage continu',
  sens_travail: 'Sens au travail',
  evoluer_rapidement: 'Évolution rapide',
  temps_pour_soi: 'Équilibre vie pro / vie perso',
  autonomie: 'Autonomie',
  travail_equipe: "Travail d'équipe",
  initiatives: "Prise d'initiatives",
}

export const TRAIT_LABELS: Record<string, string> = {
  curious: 'Curiosité',
  rigorous: 'Rigueur',
  empathetic: 'Empathie',
  creative: 'Créativité',
  leader: 'Leadership',
  autonomous: 'Autonomie',
  analytical: 'Esprit analytique',
  communicator: 'Communication',
  resilient: 'Résilience',
  organized: 'Organisation',
  collaborative: 'Esprit collaboratif',
  adaptable: 'Adaptabilité',
}

export const DEALBREAKER_LABELS: Record<string, string> = {
  management_autoritaire: 'management autoritaire',
  pas_evolution: "pas de perspectives d'évolution",
  mauvaise_ambiance: "mauvaise ambiance d'équipe",
  travail_repetitif: 'travail répétitif',
  aucune_reconnaissance: 'aucune reconnaissance',
  manque_sens: 'manque de sens',
  forte_pression: 'forte pression sur les résultats',
  pas_feedback: 'absence de feedback',
  pas_flexibilite: "absence de flexibilité d'horaires",
  heures_sup: 'heures supplémentaires fréquentes',
}

export const TEST_TYPE_LABELS: Record<string, string> = {
  mbti: 'MBTI',
  disc: 'DISC',
  big_five: 'Big Five / OCEAN',
  enneagram: 'Ennéagramme',
  other: 'Autre test',
}

export const SITUATION_LABELS: Record<string, string> = {
  job_seeking: "En recherche d'emploi",
  employed: 'En poste',
  student: 'En études',
}

export const CONTRACT_LABELS: Record<string, string> = {
  cdd: 'CDD',
  cdi: 'CDI',
  alternance: 'Alternance',
}

export const REMOTE_LABELS: Record<string, string> = {
  full_remote: '100 % télétravail',
  hybrid: 'Hybride',
  onsite: 'Sur site',
  flexible: 'Flexible',
}

export const SALARY_LABELS: Record<string, string> = {
  less_30k: '< 30 k€',
  '30_40k': '30 à 40 k€',
  '40_50k': '40 à 50 k€',
  '50_60k': '50 à 60 k€',
  '60_80k': '60 à 80 k€',
  '80_100k': '80 à 100 k€',
  more_100k: '> 100 k€',
  no_preference: 'Sans préférence',
}

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  bac: 'Bac',
  bac_plus_2: 'Bac +2',
  bac_plus_3: 'Bac +3',
  bac_plus_4: 'Bac +4',
  bac_plus_5: 'Bac +5',
  doctorat: 'Doctorat',
  autre: 'Autre',
}

/**
 * Convertit n'importe quel format de `skills` rencontré en DB vers le
 * format actuel (liste plate `string[]`).
 *
 * Formats historiques supportés :
 *   - `{ highlighted: string[]; others: string[] }` (1re version)
 *   - `Array<{ domain: string; items: string[] }>`   (2e version, par domaine)
 *   - `string[]`                                     (format actuel)
 */
export function migrateLegacySkills(legacy: unknown): string[] {
  if (Array.isArray(legacy)) {
    return legacy
      .flatMap((entry) => {
        if (typeof entry === 'string') return [entry]
        if (entry && typeof entry === 'object' && Array.isArray((entry as { items?: unknown }).items)) {
          return ((entry as { items: unknown[] }).items).filter(
            (s): s is string => typeof s === 'string',
          )
        }
        return []
      })
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (legacy && typeof legacy === 'object') {
    const obj = legacy as { highlighted?: unknown; others?: unknown }
    return [
      ...(Array.isArray(obj.highlighted) ? (obj.highlighted as unknown[]) : []),
      ...(Array.isArray(obj.others) ? (obj.others as unknown[]) : []),
    ]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Construit le CV brut (avant enrichissement IA). Le headline et le summary
 * sont des placeholders factuels qui seront remplacés par des versions
 * narratives via lib/kit/ai-cv-enricher.ts.
 */
export function buildCV(params: BuildCVParams): CVData {
  const fullName =
    [params.profile.first_name, params.profile.last_name].filter(Boolean).join(' ').trim() ||
    'Candidat·e'

  const skills = params.skills.map((s) => s.trim()).filter(Boolean)

  return {
    identity: {
      fullName,
      email: params.profile.email,
      location: params.dreamJob?.locations?.[0] ?? params.job.location ?? null,
    },
    headline: params.job.title
      ? `Candidature au poste de ${params.job.title}`
      : 'Profil professionnel',
    summary: '',
    experiences: params.experiences.map((exp) => ({
      jobTitle: exp.job_title,
      companyName: exp.company_name,
      location: exp.location,
      startDate: exp.start_date,
      endDate: exp.end_date,
      isCurrent: exp.is_current,
      mainTasks: exp.main_tasks,
    })),
    education: params.academic
      ? [
          {
            level:
              EDUCATION_LEVEL_LABELS[params.academic.education_level] ??
              params.academic.education_level,
            diploma: params.academic.diploma_name,
            school: params.academic.school_name,
            fields: params.academic.field_of_study,
            graduationDate: params.academic.graduation_date,
          },
        ]
      : [],
    skills,
    softSkills: [],
    interests: [],
    languages: [],
  }
}

/**
 * Formate "YYYY-MM-DD" ou "YYYY-MM" → "MM/YYYY".
 */
export function formatPeriod(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (d: string) => {
    const [year, month] = d.split('-')
    return month ? `${month}/${year}` : year
  }
  const startLabel = fmt(start)
  if (isCurrent) return `${startLabel} – Aujourd'hui`
  if (end) return `${startLabel} – ${fmt(end)}`
  return startLabel
}
