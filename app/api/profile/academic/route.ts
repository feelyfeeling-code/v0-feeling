import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, education_level, graduation_date, diploma_name, school_name, field_of_study } =
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
      .from('academic_profiles')
      .upsert(
        {
          user_id: userId,
          education_level: education_level || null,
          graduation_date: graduation_date || null,
          diploma_name: diploma_name?.trim() || null,
          school_name: school_name?.trim() || null,
          field_of_study: field_of_study ?? [],
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
