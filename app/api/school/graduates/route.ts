import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { getSchoolGraduates } from '@/lib/school/queries'
import { NextResponse } from 'next/server'

// GET : liste des diplômés de l'école avec indicateurs agrégés
// Params optionnels : ?status=searching&program=...&search=nom&coaching=pending
export async function GET(request: Request) {
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)

  if (!advisor) {
    return NextResponse.json({ error: 'Accès réservé aux conseillers' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const graduates = await getSchoolGraduates(supabase, advisor.schoolId, {
    status: searchParams.get('status'),
    program: searchParams.get('program'),
    search: searchParams.get('search'),
    coaching: searchParams.get('coaching'),
  })

  return NextResponse.json({ graduates })
}
