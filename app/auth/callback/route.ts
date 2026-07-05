import { createClient } from '@/lib/supabase/server'
import { getUserRole, landingPathForRole } from '@/lib/auth/getRole'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Si aucune destination explicite, router selon le rôle
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      const role = await getUserRole(supabase)
      return NextResponse.redirect(`${origin}${landingPathForRole(role)}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
