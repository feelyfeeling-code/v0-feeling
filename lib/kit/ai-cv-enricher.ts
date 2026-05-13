/**
 * Enrichissement IA du CV — Claude Sonnet 4 produit un CV de niveau senior,
 * en exploitant pleinement les insights Feeling (traits pondérés 50/30/20,
 * valeurs, dealbreakers, situation actuelle, scores de compatibilité).
 */

import { z } from 'zod'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import {
  TRAIT_LABELS,
  VALUE_LABELS,
  DEALBREAKER_LABELS,
  TEST_TYPE_LABELS,
  SITUATION_LABELS,
  CONTRACT_LABELS,
  REMOTE_LABELS,
  SALARY_LABELS,
  partitionSkillsByRelevance,
  type CVData,
} from './cv-builder'

interface EnrichParams {
  cv: CVData
  personality: {
    traits: string[]
    has_taken_test: boolean
    test_type: string | null
    test_result: string | null
  } | null
  valuesRaw: { selected_values: string[]; dealbreakers: string[] } | null
  dreamJob: {
    job_titles: string[]
    locations: string[]
    industries: string[]
    remote_preference: string | null
    salary_range: string | null
  } | null
  currentSituation: {
    situations: string[]
    job_search_types: string[]
  } | null
  experiencesRaw: Array<{
    job_title: string
    company_name: string
    main_tasks: string | null
  }>
  skillsRaw: string[]
  job: {
    title: string | null
    company: string | null
    description: string | null
    location: string | null
    remote: string | null
    industry: string | null
  }
  analysisScores: {
    overall: number | null
    personality: number | null
    values: number | null
    skills: number | null
  }
  analysisInsights: {
    strengths: string[]
    personalityFit: string[]
    valuesFit: string[]
  }
}

const enrichmentSchema = z.object({
  headline: z
    .string()
    .describe(
      "Phrase de positionnement de 8 à 14 mots qui qualifie professionnellement le candidat pour CE poste, intégrant un angle métier de l'offre + le trait dominant + une valeur différenciante. INTERDIT : 'Candidature au poste de', 'Profil professionnel', 'Motivé(e)', 'Dynamique', 'Passionné(e)'.",
    ),
  summary: z
    .string()
    .describe(
      "Paragraphe profil de 70 à 110 mots. Cite au moins un fait concret du parcours, incarne le trait dominant via une réalisation, aligne une valeur sur la culture de l'entreprise. Rédaction fluide, pas de liste plate. INTERDIT : 'motivé', 'passionné', 'dynamique', 'à l'aise avec', 'force de proposition', 'polyvalent', em-dashes.",
    ),
  softSkills: z
    .array(z.string().min(3).max(40))
    .min(3)
    .max(6)
    .describe(
      "3 à 6 soft skills dérivées UNIQUEMENT des traits pondérés (50/30/20) et des valeurs déclarées. Phrasage concret et actionnable (2 à 5 mots), 1re lettre en majuscule. Exemples : 'Esprit analytique', 'Conduite de projet', 'Sens du détail'.",
    ),
  experienceBullets: z
    .array(
      z.object({
        index: z
          .number()
          .int()
          .describe("Index 0-based de l'expérience dans la liste fournie"),
        bullets: z
          .array(z.string().min(20).max(220))
          .max(5)
          .describe(
            "0 à 5 puces respectant le contrat de qualité (verbe d'action puissant, objet concret, scope/impact si la source le permet). Aucune invention. Priorité à ce qui matche l'offre.",
          ),
      }),
    )
    .describe('Une entrée par expérience fournie, dans l\'ordre.'),
  skillsHighlighted: z
    .array(z.string())
    .describe(
      "Sous-ensemble strict de la liste fournie, pertinent pour l'offre (match direct ou conceptuel).",
    ),
  skillsOthers: z
    .array(z.string())
    .describe('Compétences fournies non retenues. Union exacte = liste fournie.'),
})

export type CVEnrichment = z.infer<typeof enrichmentSchema>

function safeTrait(traits: string[], i: number): string {
  const t = traits[i]
  if (!t) return '(non renseigné)'
  return TRAIT_LABELS[t] ?? t
}

function formatSituations(
  situation: { situations: string[]; job_search_types: string[] } | null,
): string {
  if (!situation?.situations?.length) return 'Non renseignée'
  return situation.situations
    .map((key) => SITUATION_LABELS[key] ?? key)
    .join(' + ')
}

function formatContractTypes(situation: { job_search_types: string[] } | null): string[] {
  if (!situation?.job_search_types?.length) return []
  return situation.job_search_types.map((c) => CONTRACT_LABELS[c] ?? c)
}

export async function enrichCVWithAI(params: EnrichParams): Promise<CVData> {
  const {
    cv,
    personality,
    valuesRaw,
    dreamJob,
    currentSituation,
    experiencesRaw,
    skillsRaw,
    job,
    analysisScores,
    analysisInsights,
  } = params

  const descBudget = 3800
  const jobDescription = job.description
    ? job.description.length > descBudget
      ? job.description.slice(0, descBudget) + '\n\n[…texte tronqué…]'
      : job.description
    : '(description non disponible)'

  const traits = personality?.traits ?? []
  const trait0 = safeTrait(traits, 0)
  const trait1 = safeTrait(traits, 1)
  const trait2 = safeTrait(traits, 2)

  const personalityTest =
    personality?.has_taken_test && personality.test_result
      ? `${TEST_TYPE_LABELS[personality.test_type ?? 'other'] ?? 'Test'} → ${personality.test_result}`
      : 'Non renseigné'

  const valuesList = (valuesRaw?.selected_values ?? []).map((v) => VALUE_LABELS[v] ?? v)
  const valuesLine = valuesList.length > 0 ? valuesList.join(', ') : '(aucune)'

  const dealbreakersList = (valuesRaw?.dealbreakers ?? []).map(
    (d) => DEALBREAKER_LABELS[d] ?? d,
  )
  const dealbreakersLine = dealbreakersList.length > 0 ? dealbreakersList.join(', ') : '(aucun)'

  const currentSituationLine = formatSituations(currentSituation)
  const contractTypes = formatContractTypes(currentSituation)
  const contractTypesLine = contractTypes.length > 0 ? contractTypes.join(', ') : '(non précisés)'

  const targetIndustries = dreamJob?.industries ?? []
  const targetIndustriesLine =
    targetIndustries.length > 0 ? targetIndustries.join(', ') : '(non précisés)'
  const targetLocationLine =
    dreamJob?.locations && dreamJob.locations.length > 0
      ? dreamJob.locations.join(', ')
      : '(non précisée)'
  const remotePreferenceLine = dreamJob?.remote_preference
    ? REMOTE_LABELS[dreamJob.remote_preference] ?? dreamJob.remote_preference
    : '(non précisée)'
  const salaryRangeLine = dreamJob?.salary_range
    ? SALARY_LABELS[dreamJob.salary_range] ?? dreamJob.salary_range
    : '(non précisée)'

  const experiencesBlock =
    experiencesRaw.length === 0
      ? '(aucune expérience professionnelle renseignée)'
      : experiencesRaw
          .map(
            (e, i) =>
              `[#${i}] ${e.job_title} — ${e.company_name}\n     main_tasks brutes : ${
                e.main_tasks?.trim() || '(vide)'
              }`,
          )
          .join('\n\n')

  const skillsLine = skillsRaw.length > 0 ? skillsRaw.join(', ') : '(aucune)'

  const educationBlock =
    cv.education.length > 0
      ? cv.education
          .map(
            (e) =>
              `${e.diploma} (${e.level}) - ${e.school}${
                e.fields?.length ? ` - ${e.fields.join(', ')}` : ''
              }${e.graduationDate ? ` - ${e.graduationDate.slice(0, 7)}` : ''}`,
          )
          .join('\n')
      : '(non renseignée)'

  const strengthsBlock =
    analysisInsights.strengths.length > 0
      ? analysisInsights.strengths.map((s) => `- ${s}`).join('\n')
      : '(aucun)'
  const personalityFit =
    analysisInsights.personalityFit.length > 0
      ? analysisInsights.personalityFit.map((s) => `- ${s}`).join('\n')
      : '(aucun)'
  const valuesFit =
    analysisInsights.valuesFit.length > 0
      ? analysisInsights.valuesFit.map((s) => `- ${s}`).join('\n')
      : '(aucun)'

  const matchScore = analysisScores.overall ?? 'n/a'
  const softScore =
    analysisScores.personality !== null && analysisScores.values !== null
      ? Math.round((analysisScores.personality + analysisScores.values) / 2)
      : 'n/a'
  const hardScore = analysisScores.skills ?? 'n/a'

  const systemPrompt = `Tu es un coach CV senior. Tes CV sont parmi les meilleurs sur le marché francophone et passent la barre du recruteur en moins de 8 secondes tout en marquant par leur précision.

Tu sais que la qualité d'un CV se joue à 80 % sur la formulation des puces d'expériences. Chaque puce que tu écris doit valoir la place qu'elle occupe.

──────────────────────────────────────────────────────────────────
CONTRAT DE QUALITÉ POUR CHAQUE PUCE D'EXPÉRIENCE
──────────────────────────────────────────────────────────────────
Chaque puce DOIT respecter cette structure :

  [VERBE D'ACTION conjugué] + [OBJET CONCRET et précis]
  + [SCOPE ou IMPACT si la donnée source le permet]

RÈGLE D'OR : tu peux UNIQUEMENT utiliser des faits déjà présents
dans le texte 'main_tasks brutes' fourni pour chaque expérience.
Tu n'inventes JAMAIS un chiffre, un client, une technologie,
une équipe, une durée, un résultat qui ne sont pas explicitement
présents dans le texte source.

✔ Verbes d'action recommandés (à varier) :
  Conçu, Déployé, Lancé, Piloté, Cadré, Coordonné, Orchestré,
  Refondu, Restructuré, Industrialisé, Automatisé, Optimisé,
  Réduit, Augmenté, Multiplié, Synthétisé, Animé, Accompagné,
  Formé, Conseillé, Audité, Modélisé, Analysé, Implémenté,
  Livré, Mis en production, Sécurisé, Structuré.

✘ Verbes / formulations INTERDITS :
  "Travailler sur", "Aider à", "Participer à",
  "Être impliqué(e) dans", "Faire", "S'occuper de",
  "Assister", "Avoir en charge", "Responsable de".

✘ INTERDIT aussi :
  - Clichés : "dynamique", "motivé", "passionné",
    "force de proposition", "polyvalent", "rigoureux et organisé"
  - Em-dashes "—" → virgule, point ou tiret simple
  - Placeholders ([Nom], [Date])
  - Adjectifs vides ("important", "intéressant", "varié")

──────────────────────────────────────────────────────────────────
TRAITEMENT DES TRAITS DE PERSONNALITÉ FEELING
──────────────────────────────────────────────────────────────────
Le candidat a renseigné 3 traits classés par ordre d'importance
avec pondération : 50% / 30% / 20%.

- Le trait à 50% est son trait DOMINANT : il doit transparaître
  dans le headline, le summary et les puces prioritaires.
- Le trait à 30% est secondaire : glisse-le dans le summary
  ou 1-2 puces.
- Le trait à 20% est de fond : ne le force pas, intègre-le
  naturellement si pertinent.
- Ne jamais les nommer platement ("je suis curieux").
  Les incarner via des faits et formulations concrètes.
- Si le test de personnalité (MBTI/DISC) est renseigné,
  utilise-le pour affiner le ton et le positionnement,
  sans le mentionner explicitement dans le CV.

──────────────────────────────────────────────────────────────────
TRAITEMENT DES VALEURS FEELING
──────────────────────────────────────────────────────────────────
Le candidat a sélectionné jusqu'à 3 valeurs professionnelles
(ex. autonomie, impact, bienveillance, innovation...).
- Traduis ces valeurs en soft skills concrets et actionnables
  dans la section compétences.
- Aligne le summary sur les valeurs qui résonnent avec
  la culture perçue de l'entreprise.
- Si une valeur entre en tension avec l'offre,
  ne pas la mentionner.

──────────────────────────────────────────────────────────────────
HEADLINE ET SUMMARY
──────────────────────────────────────────────────────────────────
Le headline qualifie professionnellement le candidat pour ce
poste précis, en intégrant un angle métier de l'offre + le trait
dominant + une valeur différenciante. 8 à 14 mots.

Le summary (70-110 mots) rend visible immédiatement pourquoi
le profil colle au poste. Il cite au moins un fait concret du
parcours, incarne le trait dominant via une réalisation, aligne
une valeur sur la culture de l'entreprise. Rédaction fluide,
pas de liste plate.

──────────────────────────────────────────────────────────────────
SOFT SKILLS
──────────────────────────────────────────────────────────────────
Dérivées uniquement des traits de personnalité Feeling
(avec leur pondération) + valeurs déclarées. Phrasage concret
("Esprit analytique" plutôt que "Analytique"). Jamais en dehors
de ces sources.

──────────────────────────────────────────────────────────────────
HARD SKILLS
──────────────────────────────────────────────────────────────────
Reclasse la liste fournie entre "highlighted" (match direct
avec l'offre) et "others" (le reste). Pas d'invention.

──────────────────────────────────────────────────────────────────
PROFIL JUNIOR / ÉTUDIANT
──────────────────────────────────────────────────────────────────
Le candidat est un Bac+5. Si peu d'expériences professionnelles,
valorise la formation, les projets académiques, les stages,
et les qualités humaines ancrées dans des faits concrets.
Ne pas compenser le manque d'expérience par des formulations
vagues ou des adjectifs creux.

──────────────────────────────────────────────────────────────────
DEALBREAKERS
──────────────────────────────────────────────────────────────────
Les critères rédhibitoires servent UNIQUEMENT à savoir quoi
ne pas valoriser. Ne JAMAIS les écrire dans le CV ni les
mentionner négativement.`

  const userPrompt = `=== OFFRE CIBLÉE ===
Poste : ${job.title ?? '(non précisé)'}
Entreprise : ${job.company ?? '(non précisée)'}
Lieu : ${job.location ?? '(non précisé)'}
Télétravail : ${job.remote ?? '(non précisé)'}
Secteur : ${job.industry ?? '(non précisé)'}

Description complète :
${jobDescription}

=== PROFIL CANDIDAT FEELING ===
Nom : ${cv.identity.fullName}

Traits de personnalité (classés par importance) :
- Trait dominant (50%) : ${trait0}
- Trait secondaire (30%) : ${trait1}
- Trait de fond (20%) : ${trait2}
Test de personnalité : ${personalityTest}

Valeurs professionnelles : ${valuesLine}
Critères rédhibitoires (ne JAMAIS valoriser) : ${dealbreakersLine}

Situation actuelle : ${currentSituationLine}
Types de contrats visés : ${contractTypesLine}
Secteurs ciblés : ${targetIndustriesLine}
Localisation souhaitée : ${targetLocationLine}
Préférence télétravail : ${remotePreferenceLine}
Tranche de salaire : ${salaryRangeLine}

=== FORMATION ===
${educationBlock}

=== EXPÉRIENCES À REFORMULER (index 0-based) ===
${experiencesBlock}

=== COMPÉTENCES TECHNIQUES (à reclasser, pas d'invention) ===
${skillsLine}

=== INSIGHTS DE COMPATIBILITÉ FEELING (matière première) ===
Score global : ${matchScore}/100
Score soft skills : ${softScore}/100
Score hard skills : ${hardScore}/100
Points forts profil ↔ offre :
${strengthsBlock}
Match personnalité ↔ poste :
${personalityFit}
Match valeurs ↔ culture :
${valuesFit}

=== TÂCHE ===
Produis l'enrichissement structuré du CV.

Avant d'écrire une puce, fais ce contrôle mental :
  1. Mon verbe d'action est-il puissant et autorisé ?
  2. L'objet de la puce est-il concret ?
  3. La puce s'appuie-t-elle uniquement sur les faits source ?
  4. Met-elle en avant ce qui matche l'offre ?
  5. Est-elle plus courte que 30 mots ?

Si "non" à l'une de ces questions : reformule. Si la donnée
source est trop maigre, écris moins de puces — qualité > volume.

Retourne le CV en JSON structuré avec les sections :
headline, summary, experiences, softSkills, hardSkills, formation.`

  let enrichment: CVEnrichment
  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: enrichmentSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.65,
    })
    enrichment = result.object
  } catch (err) {
    console.error('[ai-cv-enricher] generation failed, falling back', err)
    return cv
  }

  // Garde-fous post-IA -----------------------------------------------------
  const providedSet = new Set(skillsRaw)
  const enrichedHighlighted = enrichment.skillsHighlighted.filter((s) => providedSet.has(s))
  const enrichedOthers = enrichment.skillsOthers.filter((s) => providedSet.has(s))
  const enrichedCoverage = new Set([...enrichedHighlighted, ...enrichedOthers])
  let finalSkills = { highlighted: enrichedHighlighted, others: enrichedOthers }
  const missing = skillsRaw.filter((s) => !enrichedCoverage.has(s))
  if (skillsRaw.length > 0 && missing.length / skillsRaw.length > 0.3) {
    finalSkills = partitionSkillsByRelevance(skillsRaw, job.description)
  } else if (missing.length > 0) {
    finalSkills = {
      highlighted: enrichedHighlighted,
      others: [...enrichedOthers, ...missing],
    }
  }

  const bulletsByIndex = new Map<number, string[]>()
  for (const item of enrichment.experienceBullets) {
    if (Number.isInteger(item.index) && item.bullets.length > 0) {
      bulletsByIndex.set(item.index, item.bullets)
    }
  }

  const enrichedExperiences = cv.experiences.map((exp, i) => {
    const bullets = bulletsByIndex.get(i)
    if (bullets && bullets.length > 0) {
      const cleaned = bullets
        .map((b) => b.replace(/^[-•*]\s*/, '').replace(/—/g, '-').trim())
        .filter(Boolean)
      return { ...exp, mainTasks: cleaned.map((b) => `- ${b}`).join('\n') }
    }
    return exp
  })

  return {
    ...cv,
    headline: enrichment.headline.trim().replace(/—/g, '-'),
    summary: enrichment.summary.trim().replace(/—/g, '-'),
    softSkills: enrichment.softSkills.map((s) => s.trim()).filter(Boolean),
    experiences: enrichedExperiences,
    skills: finalSkills,
  }
}
