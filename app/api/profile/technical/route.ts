import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface WorkExperience {
  job_title: string
  company_name: string
  location: string
  start_date: string
  end_date?: string | null
  is_current: boolean
  main_tasks?: string | null
}

/**
 * Normalise un champ date en provenance d'un <input type="month">.
 * L'input renvoie "YYYY-MM" alors que Postgres attend "YYYY-MM-DD".
 * Retourne null si la valeur est vide.
 */
function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  // YYYY-MM → YYYY-MM-01 ; YYYY-MM-DD reste inchangé.
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`
  return trimmed
}

export async function POST(request: Request) {
  try {
    const { userId, skills, experiences } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Upsert technical skills
    const { error: skillsError } = await supabase
      .from('technical_skills')
      .upsert({ user_id: userId, skills: skills ?? [] }, { onConflict: 'user_id' })

    if (skillsError) {
      console.error('[technical] skills upsert failed', {
        message: skillsError.message,
        code: skillsError.code,
        details: skillsError.details,
        hint: skillsError.hint,
      })
      return NextResponse.json(
        { error: `Erreur lors de la sauvegarde des compétences : ${skillsError.message}` },
        { status: 500 }
      )
    }

    // Delete existing experiences and re-insert
    const { error: deleteError } = await supabase
      .from('work_experiences')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[technical] delete experiences failed', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
      })
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour des expériences : ${deleteError.message}` },
        { status: 500 }
      )
    }

    if (experiences && experiences.length > 0) {
      // Normalise les dates (format "YYYY-MM" en provenance du input month → "YYYY-MM-DD").
      const rows = (experiences as WorkExperience[]).map((exp) => ({
        user_id: userId,
        job_title: exp.job_title,
        company_name: exp.company_name,
        location: exp.location || '',
        start_date: normalizeDate(exp.start_date),
        end_date: exp.is_current ? null : normalizeDate(exp.end_date),
        is_current: exp.is_current,
        main_tasks: exp.main_tasks || null,
      }))

      const invalidRow = rows.find((r) => !r.start_date)
      if (invalidRow) {
        return NextResponse.json(
          {
            error: `Date de début manquante ou invalide pour l'expérience "${invalidRow.job_title}".`,
          },
          { status: 400 }
        )
      }

      const { error: experiencesError } = await supabase
        .from('work_experiences')
        .insert(rows)

      if (experiencesError) {
        console.error('[technical] insert experiences failed', {
          message: experiencesError.message,
          code: experiencesError.code,
          details: experiencesError.details,
          hint: experiencesError.hint,
          sampleRow: rows[0],
        })
        return NextResponse.json(
          {
            error: `Erreur lors de la sauvegarde des expériences : ${experiencesError.message}${
              experiencesError.hint ? ` (${experiencesError.hint})` : ''
            }`,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[technical] unexpected error:', message, error)
    return NextResponse.json(
      { error: `Une erreur est survenue : ${message}` },
      { status: 500 }
    )
  }
}
