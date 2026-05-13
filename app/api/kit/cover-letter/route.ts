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
    const { analysisId } = await request.json()
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId requis' }, { status: 400 })
    }

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

    const systemPrompt = `Tu es un rédacteur d'élite spécialisé en lettres de motivation
pour candidats francophones Bac+5 en début de carrière.
Tu écris des lettres qui font la différence : naturelles,
précises, ancrées dans des faits concrets, avec un angle qui
parle directement à l'entreprise et au poste.

RÈGLES IMPÉRATIVES :
- Tu écris à la première personne ("je"), en français
  professionnel, chaleureux et précis.
- Tu n'utilises JAMAIS de tirets cadratins (em-dashes "—").
- Tu n'inventes JAMAIS d'informations absentes du profil.
- Clichés INTERDITS : "dynamique", "motivé(e)", "passionné(e)",
  "force de proposition", "à la recherche d'un nouveau défi",
  "polyvalent", "rigoureux et organisé".
- Aucun placeholder ([Nom], [Date], [Entreprise]).
- Tu produis UNIQUEMENT le corps de la lettre : pas d'en-tête,
  pas de "Madame, Monsieur", pas de signature.
- Tu commences directement par le premier paragraphe.

──────────────────────────────────────────────────────────────────
TRAITEMENT DES TRAITS DE PERSONNALITÉ FEELING
──────────────────────────────────────────────────────────────────
Le candidat a 3 traits pondérés (50% / 30% / 20%).

- Trait dominant (50%) : doit transparaître dans le paragraphe 2,
  incarné dans une réalisation concrète. C'est l'angle humain
  principal de la lettre.
- Trait secondaire (30%) : glisse-le naturellement dans
  le paragraphe 2 ou 3.
- Trait de fond (20%) : seulement si pertinent et naturel.
- Ne jamais les nommer platement. Les montrer, pas les dire.
- Si le test MBTI/DISC est renseigné, utilise-le pour affiner
  le ton de la lettre sans le mentionner explicitement.

──────────────────────────────────────────────────────────────────
TRAITEMENT DES VALEURS FEELING
──────────────────────────────────────────────────────────────────
Le candidat a jusqu'à 3 valeurs professionnelles déclarées.
- Mobilise la valeur la plus alignée avec la culture de
  l'entreprise dans le paragraphe 3.
- Ancre-la dans un fait ou une posture concrète, pas une
  déclaration d'intention.
- Si une valeur entre en tension avec l'offre : ne pas
  la mentionner.

──────────────────────────────────────────────────────────────────
STRUCTURE OBLIGATOIRE — 3 PARAGRAPHES
──────────────────────────────────────────────────────────────────
Paragraphe 1 (2-4 phrases) — Hook :
  Mentionne un élément concret de l'offre ou de l'entreprise
  qui résonne avec le profil. Évite "Je vous écris pour...".
  Entre par l'angle qui rend cette candidature pertinente.

Paragraphe 2 (5-8 phrases) — Bridge profil ↔ poste :
  Cite AU MOINS UNE expérience nommée (entreprise + mission).
  Incarne le trait dominant via cette expérience.
  Mobilise UNE valeur ancrée dans une réalisation.
  Si pertinent, glisse une compétence technique de l'offre.

Paragraphe 3 (2-3 phrases) — Projection :
  Pourquoi cette entreprise spécifiquement (culture, ambition,
  secteur) en lien avec les valeurs du candidat.
  Propose un échange. Sans formule creuse.

──────────────────────────────────────────────────────────────────
CONTRAINTES DE STYLE
──────────────────────────────────────────────────────────────────
- Longueur : 240 à 340 mots.
- Pas de répétition du même verbe d'introduction.
- Verbes d'action concrets et conjugués.
- Transitions dosées ("Par ailleurs" autorisé mais pas systématique).
- DEALBREAKERS : usage interne uniquement. Ne JAMAIS les
  mentionner dans la lettre, même en creux.`

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

=== TÂCHE ===
Rédige la lettre. Exploite vraiment tout : le trait dominant
incarné dans une expérience nommée, une valeur ancrée dans
un fait, un élément concret de l'offre.

Ne renvoie QUE le corps (3 paragraphes, pas d'en-tête,
pas de signature). Commence directement par le premier paragraphe.`

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.75,
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
