import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, job_titles, locations, location_radius, industries, salary_range, remote_preference } =
      await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { error } = await supabase
      .from('dream_jobs')
      .upsert(
        {
          user_id: userId,
          job_titles: job_titles ?? [],
          locations: locations ?? [],
          location_radius: location_radius ?? 0,
          industries: industries ?? [],
          salary_range: salary_range || null,
          remote_preference: remote_preference || null,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
