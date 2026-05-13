'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { X } from 'lucide-react'

export function OnboardingTermineView() {
  const router = useRouter()

  const goToAccueil = () => {
    router.push('/accueil')
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Bouton fermer (top-left) */}
      <button
        type="button"
        onClick={goToAccueil}
        aria-label="Fermer"
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-5xl mx-auto px-6 min-h-screen flex items-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 w-full">
          {/* Bloc texte + CTA */}
          <div className="flex-1 max-w-xl">
            <p className="text-base md:text-lg mb-6 leading-relaxed">
              J&apos;ai bien recu tout ce qu&apos;il faut pour te connaitre.
              <br />
              Tu es pret(e) pour la suite
            </p>

            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-6">
              Des maintenant, tu peux tester des offres
            </h1>

            <p className="text-base md:text-lg mb-8">
              Je t&apos;aiderai a mieux cibler celles sur lesquelles candidater.
            </p>

            <Button
              onClick={goToAccueil}
              className="h-14 px-8 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base font-bold"
            >
              Tester une offre
            </Button>
          </div>

          {/* Mascotte avec bulle "C'est parti !" */}
          <div className="flex-shrink-0">
            <FeelyMascot
              variant="blue"
              size="xl"
              speechBubble="C'est parti !"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
