import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import {
  TRAIT_LABELS,
  VALUE_LABELS,
  DEALBREAKER_LABELS,
  TEST_TYPE_LABELS,
  SITUATION_LABELS,
  CONTRACT_LABELS,
  REMOTE_LABELS,
} from '@/lib/kit/cv-builder'

export async function POST(request: Request) {
  try {
    const { analysisId, forceRegenerate } = await request.json()
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId requis' }, { status: 400 })
    }
    // Variation : à chaque régénération, on bump la temperature et on
    // injecte une directive d'angle alternatif pour ne pas reproduire
    // la même lettre que la fois précédente.
    const variationSeed = forceRegenerate ? 1 + Math.floor(Math.random() * 2) : 0

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const userId = user.id

    const { data: analysis, error: analysisError } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single()
    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 })
    }

    const [
      profileResult,
      personalityResult,
      valuesResult,
      experiencesResult,
      skillsResult,
      academicResult,
      dreamJobResult,
      currentSituationResult,
    ] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name').eq('id', userId).single(),
      supabase
        .from('personality_profiles')
        .select('traits, has_taken_test, test_type, test_result')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('values_profiles')
        .select('selected_values, dealbreakers')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('work_experiences')
        .select('job_title, company_name, main_tasks, start_date, end_date, is_current')
        .eq('user_id', userId)
        .order('start_date', { ascending: false }),
      supabase.from('technical_skills').select('skills').eq('user_id', userId).maybeSingle(),
      supabase
        .from('academic_profiles')
        .select('education_level, diploma_name, school_name, field_of_study')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('dream_jobs')
        .select('industries, remote_preference')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('current_situations')
        .select('situations, job_search_types')
        .eq('user_id', userId)
        .maybeSingle(),
    ])

    const fullName =
      [profileResult.data?.first_name, profileResult.data?.last_name]
        .filter(Boolean)
        .join(' ') || 'Le candidat'

    // ─── Traits Feeling pondérés 50/30/20 ────────────────────────────────
    const rawTraits = personalityResult.data?.traits ?? []
    const trait0 = rawTraits[0] ? TRAIT_LABELS[rawTraits[0]] ?? rawTraits[0] : '(non renseigné)'
    const trait1 = rawTraits[1] ? TRAIT_LABELS[rawTraits[1]] ?? rawTraits[1] : '(non renseigné)'
    const trait2 = rawTraits[2] ? TRAIT_LABELS[rawTraits[2]] ?? rawTraits[2] : '(non renseigné)'

    const personalityTest =
      personalityResult.data?.has_taken_test && personalityResult.data?.test_result
        ? `${TEST_TYPE_LABELS[personalityResult.data.test_type ?? 'other'] ?? 'Test'} → ${
            personalityResult.data.test_result
          }`
        : 'Non renseigné'

    // ─── Valeurs / dealbreakers ─────────────────────────────────────────
    const valuesList = (valuesResult.data?.selected_values ?? []).map(
      (v: string) => VALUE_LABELS[v] ?? v,
    )
    const valuesLine = valuesList.length > 0 ? valuesList.join(', ') : '(aucune)'
    const dealbreakersList = (valuesResult.data?.dealbreakers ?? []).map(
      (d: string) => DEALBREAKER_LABELS[d] ?? d,
    )
    const dealbreakersLine = dealbreakersList.length > 0 ? dealbreakersList.join(', ') : '(aucun)'

    // ─── Situation actuelle ─────────────────────────────────────────────
    const situations = currentSituationResult.data?.situations ?? []
    const currentSituationLine =
      situations.length > 0
        ? situations.map((s: string) => SITUATION_LABELS[s] ?? s).join(' + ')
        : 'Non renseignée'
    const contractTypes = (currentSituationResult.data?.job_search_types ?? []).map(
      (c: string) => CONTRACT_LABELS[c] ?? c,
    )
    const contractTypesLine = contractTypes.length > 0 ? contractTypes.join(', ') : '(non précisés)'

    // ─── Secteurs / télétravail ─────────────────────────────────────────
    const targetIndustries = dreamJobResult.data?.industries ?? []
    const targetIndustriesLine =
      targetIndustries.length > 0 ? targetIndustries.join(', ') : '(non précisés)'
    const remotePreferenceLine = dreamJobResult.data?.remote_preference
      ? REMOTE_LABELS[dreamJobResult.data.remote_preference] ??
        dreamJobResult.data.remote_preference
      : '(non précisée)'

    // ─── Skills / Formation / Expériences ───────────────────────────────
    const skills = skillsResult.data?.skills ?? []
    const skillsBlock = skills.length > 0 ? skills.join(', ') : '(aucune renseignée)'

    const experiences = experiencesResult.data ?? []
    const experiencesBlock =
      experiences.length === 0
        ? '(aucune expérience professionnelle renseignée)'
        : experiences
            .map((e: any) => {
              const period = `${e.start_date?.slice(0, 7) ?? '?'} → ${
                e.is_current ? "aujourd'hui" : e.end_date?.slice(0, 7) ?? '?'
              }`
              return `- ${e.job_title} chez ${e.company_name} (${period})${
                e.main_tasks ? `\n  Missions : ${e.main_tasks}` : ''
              }`
            })
            .join('\n')

    const academic = academicResult.data
    const academicBlock = academic
      ? `${academic.diploma_name} à ${academic.school_name}${
          academic.field_of_study?.length ? ` (${academic.field_of_study.join(', ')})` : ''
        }`
      : 'non renseignée'

    // ─── Insights ───────────────────────────────────────────────────────
    const strengthsBlock = Array.isArray(analysis.strengths)
      ? analysis.strengths.map((s: string) => `- ${s}`).join('\n')
      : '(aucun)'
    const personalityFit = analysis.personality_analysis?.strengths
      ? analysis.personality_analysis.strengths.map((s: string) => `- ${s}`).join('\n')
      : '(aucun)'
    const valuesFit = analysis.values_analysis?.strengths
      ? analysis.values_analysis.strengths.map((s: string) => `- ${s}`).join('\n')
      : '(aucun)'

    const matchScore = analysis.overall_score ?? 'n/a'
    const softScore =
      analysis.personality_score !== null && analysis.values_score !== null
        ? Math.round((analysis.personality_score + analysis.values_score) / 2)
        : 'n/a'
    const hardScore = analysis.skills_score ?? 'n/a'

    const jobDescription = (analysis.job_description ?? '').slice(0, 4000)

    const systemPrompt = `Tu rédiges une lettre de motivation française
classique, professionnelle, humaine et crédible.

OBJECTIF : produire une vraie lettre de motivation qui respecte
les codes d'une candidature française, pas un pitch marketing
ni une réponse IA.

──────────────────────────────────────────────────────────────────
RÈGLES IMPÉRATIVES
──────────────────────────────────────────────────────────────────
- Tu écris à la première personne ("je"), en français.
- Tu VOUVOIES l'entreprise et le recruteur ("vous", "votre").
  JAMAIS de tutoiement.
- Tu n'utilises JAMAIS de tirets cadratins (em-dashes "—").
- Tu n'inventes JAMAIS d'informations absentes du profil
  (chiffre, équipe, durée, client, technologie, résultat).
- Tu ne fais JAMAIS de promesses excessives.
- Tu ne paraphrases PAS lourdement la description de l'offre.

──────────────────────────────────────────────────────────────────
RÈGLE CARDINALE : COMMENCER PAR LE CANDIDAT, PAS PAR L'ENTREPRISE
──────────────────────────────────────────────────────────────────
Le premier paragraphe doit parler du CANDIDAT et du POSTE.
Il ne doit JAMAIS commencer par une mini-présentation
publicitaire de l'entreprise du genre :
  ✘ "Hiflow révolutionne la livraison automobile..."
  ✘ "Leader sur son marché, votre entreprise..."
  ✘ "Votre entreprise dynamique et innovante m'attire..."

Démarre par l'intention du candidat. Tu peux mentionner ce
qui t'intéresse dans le poste ou l'entreprise, mais sobrement,
en une demi-phrase glissée dans l'intro — pas en hook commercial.

✔ Exemple cible d'intro :
  "Je vous adresse ma candidature pour le poste de Product
  Designer, qui a retenu mon attention par la place donnée
  à l'expérience utilisateur et à l'amélioration continue
  des parcours."

──────────────────────────────────────────────────────────────────
MOTS ET FORMULES INTERDITS
──────────────────────────────────────────────────────────────────
✘ Verbes commerciaux : "révolutionne", "transforme",
  "s'impose comme", "se positionne comme", "incarne"
  (sauf si réellement nécessaire et formulé très sobrement).
✘ Hooks IA : "Votre entreprise dynamique et innovante m'attire
  particulièrement", "Je suis passionné par votre secteur",
  "Je souhaite mettre mes compétences au service de votre
  entreprise", "C'est avec un grand intérêt".
✘ Clichés candidats : "dynamique", "motivé(e)", "passionné(e)",
  "force de proposition", "à l'aise avec", "polyvalent",
  "rigoureux et organisé", "à la recherche d'un nouveau défi".
✘ Superlatifs creux : "excellent", "remarquable", "exceptionnel".
✘ Promesses excessives : "porter l'expérience au niveau
  supérieur", "apporter une vision unique".
✘ Placeholders ([Nom], [Date], [Entreprise]).

──────────────────────────────────────────────────────────────────
STRUCTURE OBLIGATOIRE (la lettre complète, telle qu'attendue)
──────────────────────────────────────────────────────────────────
Tu produis la lettre COMPLÈTE avec :

1. FORMULE D'APPEL (1re ligne) :
   "Madame, Monsieur,"

2. PARAGRAPHE D'INTRODUCTION (2-3 phrases) :
   Pourquoi tu écris. Le poste visé. Ce qui t'intéresse —
   formulé sobrement, ancré sur un élément concret du poste
   ou de l'entreprise (pas un slogan).

3. PARAGRAPHE CANDIDAT (3-5 phrases) :
   1 à 2 expériences pertinentes nommées (entreprise +
   mission). Verbes au passé composé simple : "j'ai mené",
   "j'ai conçu", "j'ai géré", "j'ai construit", "j'ai
   accompagné". Faits concrets. Pas de liste de compétences
   sèche. Lien avec les attentes du poste.

4. PARAGRAPHE PROJECTION (2-3 phrases) :
   Ce que tu peux apporter à l'entreprise au regard de ton
   parcours et des besoins identifiés dans l'offre.
   Sobre, crédible, pas de promesse marketing.

5. PARAGRAPHE DE CONCLUSION (1 phrase) :
   Proposer un échange.
   ✔ Exemple : "Je serais ravi d'échanger avec vous afin
   de vous présenter plus en détail ma motivation et la
   manière dont mon parcours peut répondre aux besoins
   du poste."

6. FORMULE DE POLITESSE (sur sa propre ligne) :
   "Je vous prie d'agréer, Madame, Monsieur, l'expression
   de mes salutations distinguées."

PAS de nom de candidat / signature à la fin (le PDF l'ajoute).

──────────────────────────────────────────────────────────────────
USAGE DES TRAITS ET VALEURS FEELING
──────────────────────────────────────────────────────────────────
Les traits Feeling (pondérés 50/30/20) et les valeurs te
servent à colorer le ton et choisir QUELLES expériences citer.
Ne jamais les nommer platement ("je suis curieux", "j'attache
de l'importance à l'autonomie"). Les incarner via des faits.

Les dealbreakers servent UNIQUEMENT à savoir quoi ne pas
valoriser. Ne JAMAIS les mentionner dans la lettre, même
en creux.

──────────────────────────────────────────────────────────────────
STYLE ET LONGUEUR
──────────────────────────────────────────────────────────────────
- Phrases fluides, professionnelles, humaines.
- Pas de langage familier. Pas de blabla.
- Cible 250 à 350 mots, hors formule d'appel et politesse.
- 4 à 5 paragraphes courts.
- La lettre doit tenir sur une page A4 avec marges.`

    const userPrompt = `=== ENTREPRISE / OFFRE ===
Poste : ${analysis.job_title ?? '(non précisé)'}
Entreprise : ${analysis.company_name ?? '(non précisée)'}
Lieu : ${analysis.job_location ?? '(non précisé)'}
Télétravail : ${analysis.job_remote ?? '(non précisé)'}
Secteur : ${analysis.job_industry ?? '(non précisé)'}

Description complète de l'offre :
${jobDescription || "(description non disponible — base-toi sur l'intitulé)"}

=== PROFIL COMPLET FEELING ===
Nom : ${fullName}

Traits de personnalité (pondérés) :
- Trait dominant (50%) : ${trait0}
- Trait secondaire (30%) : ${trait1}
- Trait de fond (20%) : ${trait2}
Test de personnalité : ${personalityTest}

Valeurs professionnelles : ${valuesLine}
Critères rédhibitoires (NE PAS valoriser — usage interne) :
${dealbreakersLine}

Situation actuelle : ${currentSituationLine}
Types de contrats visés : ${contractTypesLine}
Secteurs ciblés : ${targetIndustriesLine}
Préférence télétravail : ${remotePreferenceLine}

Formation : ${academicBlock}
Compétences techniques : ${skillsBlock}

Expériences professionnelles :
${experiencesBlock}

=== INSIGHTS DE COMPATIBILITÉ FEELING ===
Score global : ${matchScore}/100
Score soft skills : ${softScore}/100
Score hard skills : ${hardScore}/100
Points forts profil ↔ offre :
${strengthsBlock}
Match personnalité ↔ poste :
${personalityFit}
Match valeurs ↔ culture :
${valuesFit}

${
  variationSeed > 0
    ? `=== VARIATION DEMANDÉE ===
C'est une RÉGÉNÉRATION. La lettre précédente n'a pas convenu.
Change d'angle : choisis une autre expérience à mettre en
avant (si plusieurs sont disponibles), reformule le hook du
paragraphe 1 différemment (autre élément concret de
l'entreprise), tourne le paragraphe 3 autrement. Ne reprends
pas les mêmes phrases qu'une génération standard.

`
    : ''
}=== TÂCHE ===
Rédige la lettre COMPLÈTE (formule d'appel, 4 paragraphes,
formule de politesse) en respectant la structure imposée.

Avant de rédiger, vérifie mentalement :
  1. Première ligne = "Madame, Monsieur," ?
  2. Para d'intro : commence par MOI/le poste, PAS par une
     mini-présentation publicitaire de l'entreprise ?
  3. Para candidat : 1-2 expériences nommées (entreprise +
     mission) ? Verbes au passé composé simple ? Pas de
     liste de compétences sèche ?
  4. Para projection : sobre, crédible, pas de promesse
     marketing ?
  5. Para conclusion : 1 phrase qui propose un échange ?
  6. Dernière ligne = "Je vous prie d'agréer, Madame,
     Monsieur, l'expression de mes salutations distinguées." ?
  7. Aucun mot ou formule interdite (révolutionne, transforme,
     dynamique, passionné, etc.) ?
  8. 250 à 350 mots ?

Sépare chaque paragraphe par une ligne vide. PAS de nom de
candidat à la fin (la signature est ajoutée par le PDF).
Commence directement par "Madame, Monsieur,".`

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: Math.min(0.75 + variationSeed * 0.15, 0.95),
    })

    const coverLetter = text.trim().replace(/—/g, '-')

    const { error: upsertError } = await supabase
      .from('application_kits')
      .upsert(
        {
          user_id: userId,
          analysis_id: analysisId,
          cover_letter: coverLetter,
        },
        { onConflict: 'user_id,analysis_id' },
      )

    if (upsertError) {
      console.error('[kit/cover-letter] upsert error', upsertError)
      return NextResponse.json(
        { error: `Erreur sauvegarde : ${upsertError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ coverLetter })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[kit/cover-letter] error', message)
    return NextResponse.json(
      { error: `Erreur lors de la génération : ${message}` },
      { status: 500 },
    )
  }
}
