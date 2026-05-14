'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FeelingLogo } from '@/components/feeling-logo'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * Header partagé des pages authentifiées : logo Feeling, lien "Mon profil",
 * bouton "Déconnexion". Sticky en haut de page. Utilisé sur /accueil,
 * /resultats, /resultats-complets, /kit-candidature, /profil,
 * /profil-technique.
 *
 * Le lien "Mon profil" est masqué quand l'utilisateur est déjà sur une
 * page liée à son profil (/profil, /profil-technique).
 */
export function AuthHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const isOnProfilePage =
    pathname === '/profil' || pathname?.startsWith('/profil-technique')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="w-full bg-background sticky top-0 z-50 mt-4">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/accueil" aria-label="Retour à l'accueil">
          <FeelingLogo size="md" className="mt-4" />
        </Link>

        <div className="flex items-center gap-3">
          {!isOnProfilePage && (
            <Button variant="ghost" size="lg" asChild>
              <Link href="/profil">Mon profil</Link>
            </Button>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="lg"
            className="bg-background text-foreground"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  )
}
