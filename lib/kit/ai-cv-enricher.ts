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
  /**
   * Numéro de variation (0 = première génération, ≥1 = régénération).
   * Sert à varier l'angle éditorial pour produire un CV différent.
   */
  variationSeed?: number
}

const enrichmentSchema = z.object({
  headline: z
    .string()
    .describe(
      "Une phrase courte et factuelle qui dit qui est la personne et ce qu'elle cherche. Ex : 'Product Owner en recherche d'un poste à Paris'. INTERDIT : 'Candidature au poste de', 'Profil professionnel', 'Motivé(e)', 'Dynamique', 'Passionné(e)', 'Fort(e) de'.",
    ),
  summary: z
    .string()
    .describe(
      "Phrase d'accroche très courte : 1 à 2 phrases maximum, 20 à 40 mots. Présente qui est la personne (diplôme) et ce qu'elle cherche. Écris comme quelqu'un qui parle naturellement. INTERDIT : superlatifs, 'passionné(e)', 'à l'aise', 'fort(e) de', 'motivé(e)', 'dynamique', 'force de proposition', 'polyvalent', em-dashes, formules RH.",
    ),
  softSkills: z
    .array(z.string().min(3).max(40))
    .min(3)
    .max(6)
    .describe(
      "3 à 6 qualités dérivées UNIQUEMENT des traits pondérés (50/30/20) et des valeurs déclarées. Mots simples, 2 à 4 mots, 1re lettre en majuscule. Exemples : 'Esprit d'analyse', 'Sens du détail', 'Travail en équipe'. Pas de superlatifs.",
    ),
  experienceBullets: z
    .array(
      z.object({
        index: z
          .number()
          .int()
          .describe("Index 0-based de l'expérience dans la liste fournie"),
        bullets: z
          .array(z.string().min(10).max(180))
          .max(4)
          .describe(
            "3 à 4 puces qui REFORMULENT et VALORISENT ce que la personne a fait, sans recopier sa description brute. Chaque puce commence par un verbe d'action simple au participe passé, suit avec un objet concret et — si la source le permet — un scope/résultat. Le ton reste naturel et factuel. Aucune invention de chiffre, client, équipe ou résultat absent de la source.",
          ),
      }),
    )
    .describe('Une entrée par expérience fournie, dans l\'ordre.'),
  skills: z
    .array(z.string().min(2).max(80))
    .min(1)
    .max(20)
    .describe(
      "Liste plate des compétences pertinentes (3 à 15 idéalement). Items courts (outils, méthodes, langues, ou descriptions concises d'actions). Pas de barres de niveau, pas d'étoiles, pas de pourcentages. Tu peux légèrement reformuler les compétences fournies pour qu'elles soient lisibles, mais tu ne dois pas en inventer.",
    ),
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
    variationSeed = 0,
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

  const systemPrompt = `Tu rédiges des CV simples, factuels et lisibles. Le recruteur doit comprendre en quelques secondes qui est la personne, ce qu'elle a fait, et ce qu'elle cherche — sans avoir à décoder des formules pompeuses.

Ta règle d'or : écris comme quelqu'un qui parle naturellement, pas comme un CV. Préfère systématiquement la phrase simple à la formule RH.

──────────────────────────────────────────────────────────────────
SECTION PROFIL (headline + summary)
──────────────────────────────────────────────────────────────────
Le headline est UNE phrase courte qui dit qui est la personne
et ce qu'elle cherche. Ex : "Product Owner en recherche d'un
poste à Paris".

Le summary est VOLONTAIREMENT TRÈS COURT : 1 à 2 phrases
maximum, 20 à 40 mots. Présente qui est la personne (diplôme)
et ce qu'elle cherche. Tu peux glisser UN seul fait court qui
éclaire le parcours, sinon laisse à 1 phrase. Pas plus.

Exemple cible (court) : "Diplômée d'un Master en Stratégie
Digitale, je cherche un poste de Product Owner avec un pied
côté tech et un côté design."

Si tu hésites entre 1 phrase et 2 : choisis 1.

✘ INTERDIT dans le headline et le summary :
  - Superlatifs ("excellent", "fort(e) de", "remarquable")
  - "Passionné(e)", "motivé(e)", "dynamique", "à l'aise avec"
  - "Force de proposition", "polyvalent", "rigoureux et organisé"
  - "Candidature au poste de", "Profil professionnel"
  - Formules RH creuses
  - Em-dashes "—" → utiliser virgule ou tiret simple

──────────────────────────────────────────────────────────────────
SECTION EXPÉRIENCES (puces)
──────────────────────────────────────────────────────────────────
Pour chaque expérience, produis 3 à 4 puces qui REFORMULENT et
VALORISENT ce que la personne a fait. Tu ne RECOPIES JAMAIS la
description brute. Tu la traduis en formulations claires,
convaincantes et orientées action.

Ton job : prendre une description souvent imprécise, mal
structurée ou minimisée par la personne, et en faire une puce
qui montre concrètement la valeur de ce qu'elle a fait — sans
ajouter de fait nouveau.

Méthode pour chaque puce :
  1. Identifie l'action réelle derrière la formulation initiale.
     "J'ai aidé à organiser les ateliers" → l'action réelle est
     "organiser des ateliers", pas "aider à".
  2. Reformule en mettant la personne en sujet de l'action.
     Démarre par un verbe d'action simple au participe passé.
  3. Précise l'objet : QUOI exactement (le livrable, l'outil,
     le périmètre nommé dans la source).
  4. Si la source mentionne un scope (équipe de N, durée,
     nombre de projets, résultat chiffré), intègre-le.
     Sinon, n'invente RIEN.
  5. Coupe le superflu : "dans un contexte", "en lien avec",
     "afin de", "pour pouvoir", "j'ai eu l'occasion de"…

Format final : [VERBE PARTICIPE PASSÉ] + [OBJET CONCRET]
( + [SCOPE/RÉSULTAT si présent dans la source]).
10 à 25 mots par puce.

Exemples de reformulation :
  Source brute : "Aidé l'équipe marketing à faire des analyses
  pour comprendre la concurrence et faire des audits"
  → Puce : "Réalisé des veilles concurrentielles et conduit
  des audits marketing pour l'équipe"

  Source brute : "J'ai travaillé sur le backlog avec le PO
  et essayé de prioriser les sujets pour les devs"
  → Puce : "Co-géré le backlog produit et priorisé les
  fonctionnalités avec les équipes de développement"

  Source brute : "J'animais les daily et les rétros"
  → Puce : "Animé les rituels Scrum quotidiens et les
  rétrospectives d'équipe"

✔ Verbes simples recommandés (varier) :
  Géré, Animé, Organisé, Réalisé, Conduit, Mené, Suivi,
  Accompagné, Préparé, Coordonné, Construit, Lancé, Conçu,
  Rédigé, Présenté, Analysé, Formé, Déployé, Implémenté,
  Suivi, Co-géré, Cadré.

✘ Verbes pompeux INTERDITS :
  "Orchestré", "Industrialisé", "Refondu", "Restructuré",
  "Optimisé" (sauf si présent dans la source),
  "Pilotage stratégique de", "Force motrice de".

✘ Formules vides INTERDITES (à éliminer même si dans la source) :
  "Dans un contexte dynamique", "En collaboration étroite avec",
  "A contribué à", "Travailler sur", "Aider à", "Participer à",
  "Être impliqué(e) dans", "Responsable de", "J'ai eu
  l'occasion de", "Dans le cadre de mes missions".

RÈGLE D'OR DE NON-INVENTION : tu peux REFORMULER librement
(c'est même ce qu'on attend) mais tu ne dois JAMAIS inventer
un chiffre, un client, une technologie, une équipe, une durée
ou un résultat absent de la source. Si la source dit "j'ai fait
des audits", tu peux écrire "Conduit des audits marketing"
(reformulation valide) mais PAS "Conduit 12 audits marketing
sur 6 mois" (chiffres inventés).

──────────────────────────────────────────────────────────────────
SECTION COMPÉTENCES (liste plate)
──────────────────────────────────────────────────────────────────
Liste les compétences de façon simple : pas de barres de niveau,
pas d'étoiles, pas de pourcentages, pas de "maîtrise parfaite".
Pas de regroupement par domaine — une seule liste plate.

Items courts (1 à 6 mots idéalement) : outils, méthodes,
langues, ou compétences nommées. Tu peux légèrement reformuler
les compétences fournies si elles sont mal écrites, mais tu ne
dois jamais en inventer.

Exemples d'items valables :
  - Figma
  - Agile / Scrum
  - Veille concurrentielle
  - Anglais courant
  - Conduite d'audits marketing

Vise 3 à 15 items selon ce que la personne a fourni.

──────────────────────────────────────────────────────────────────
SECTION QUALITÉS (anciennement soft skills)
──────────────────────────────────────────────────────────────────
3 à 6 qualités dérivées UNIQUEMENT des traits Feeling pondérés
(50/30/20) et des valeurs déclarées. Mots simples (2 à 4 mots),
1re lettre en majuscule. Pas de superlatifs.

Exemples : "Esprit d'analyse", "Sens du détail", "Travail
en équipe", "Curiosité", "Organisation".

──────────────────────────────────────────────────────────────────
TRAITEMENT DES TRAITS FEELING
──────────────────────────────────────────────────────────────────
Le candidat a renseigné 3 traits avec pondération 50/30/20.
Le trait dominant (50%) doit transparaître dans le summary
et les qualités. Le 30% et le 20% sont secondaires. Ne jamais
les nommer platement dans le summary ("je suis curieux") —
les incarner via des faits.

──────────────────────────────────────────────────────────────────
DEALBREAKERS
──────────────────────────────────────────────────────────────────
Les critères rédhibitoires servent UNIQUEMENT à savoir quoi
ne pas valoriser. Ne JAMAIS les écrire dans le CV ni les
mentionner négativement.`

  const variationDirectives = [
    "",
    "\n=== VARIATION DEMANDÉE ===\nC'est une RÉGÉNÉRATION. Le CV précédent n'a pas convenu. Change d'angle : reformule différemment le summary (autre fait du parcours mis en avant, autre tournure), réordonne ou réécris les puces, propose un regroupement de compétences différent si possible. Ne répète pas les mêmes formulations qu'une génération standard.",
    "\n=== VARIATION DEMANDÉE ===\nC'est la 3e tentative. Le candidat cherche encore un angle qui lui parle. Essaie un summary plus court et plus direct, des puces encore plus factuelles (moins de contexte, plus d'actions). Privilégie le style B pour les compétences si pertinent (descriptions par domaine métier).",
  ]
  const variationHint = variationDirectives[Math.min(variationSeed, variationDirectives.length - 1)]

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

${variationHint}

=== TÂCHE ===
Produis l'enrichissement structuré du CV.

Avant d'écrire une puce d'expérience, vérifie :
  1. Ai-je VRAIMENT reformulé (pas recopié la source mot
     pour mot) ?
  2. La puce met-elle en valeur l'action concrète et son objet ?
  3. Mon verbe est-il simple (pas pompeux) ?
  4. Aucun chiffre, client, équipe, résultat inventé ?
  5. Aucune formule RH vide ("dans le cadre de", "a contribué
     à", "j'ai eu l'occasion de") ?
  6. Entre 10 et 25 mots ?

Si "non" à l'une de ces questions : reformule. Si la source
est trop maigre pour produire 3-4 puces valables, écris-en
moins — qualité > volume.

Avant d'écrire le summary, vérifie :
  - Est-ce que ça sonne comme quelqu'un qui parle, pas comme
    un CV ?
  - Aucun mot interdit ("passionné", "à l'aise", "fort de",
    "motivé", "dynamique") ?
  - 1 à 2 phrases max, 20 à 40 mots ? (Court !)

Retourne le CV structuré : headline, summary, softSkills,
experienceBullets, skillsByDomain.`

  let enrichment: CVEnrichment
  try {
    const result = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: enrichmentSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: Math.min(0.65 + variationSeed * 0.15, 0.95),
    })
    enrichment = result.object
  } catch (err) {
    console.error('[ai-cv-enricher] generation failed, falling back', err)
    return cv
  }

  // Garde-fous post-IA -----------------------------------------------------
  // Compétences : on accepte la liste IA, mais on s'assure qu'aucune
  // compétence brute n'est complètement perdue. Les manquantes sont
  // ajoutées en fin de liste.
  const cleanedSkills = enrichment.skills
    .map((s) => s.trim())
    .filter(Boolean)

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  const usedNormalized = new Set(cleanedSkills.map(normalize))
  const missingSkills = skillsRaw
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !usedNormalized.has(normalize(s)))
  const finalSkills =
    cleanedSkills.length > 0
      ? [...cleanedSkills, ...missingSkills]
      : skillsRaw.map((s) => s.trim()).filter(Boolean)

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
    interests: cv.interests ?? [],
  }
}
