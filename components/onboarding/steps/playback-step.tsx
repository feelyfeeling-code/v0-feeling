'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface PlaybackBlock {
  titre: string
  contenu: string
}

interface PlaybackResult {
  bloc1: PlaybackBlock
  bloc2: PlaybackBlock
  bloc3: PlaybackBlock
  bloc4: PlaybackBlock
}

interface PlaybackStepProps {
  data: OnboardingData
  onComplete: () => void
  onPrev: () => void
  isSubmitting: boolean
}

const BLOC_COLORS = [
  'bg-primary/20 border-primary/30',
  'bg-secondary/20 border-secondary/40',
  'bg-accent/20 border-accent/30',
  'bg-muted/60 border-border',
]

export function PlaybackStep({ data, onComplete, onPrev, isSubmitting }: PlaybackStepProps) {
  const [playback, setPlayback] = useState<PlaybackResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [validated, setValidated] = useState(false)

  const generate = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await fetch('/api/onboarding/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const result = await res.json()
      setPlayback(result)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleValidate = () => {
    setValidated(true)
    onComplete()
  }

  const blocs = playback
    ? [playback.bloc1, playback.bloc2, playback.bloc3, playback.bloc4]
    : []

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <div className="bg-muted/50 rounded-2xl p-4 text-left max-w-md mx-auto">
          <p className="text-sm leading-relaxed font-medium">
            Voilà ce que tes réponses révèlent de toi&nbsp;:
          </p>
        </div>
      </div>

      {/* Chargement */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">J&apos;analyse ton profil...</p>
        </div>
      )}

      {/* Erreur */}
      {!isLoading && hasError && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Une erreur est survenue. Réessaie !</p>
          <Button variant="outline" onClick={generate} className="rounded-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Résultat */}
      {!isLoading && !hasError && playback && (
        <>
          <div className="space-y-4 mb-10">
            {blocs.map((bloc, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-5 ${BLOC_COLORS[i]}`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {bloc.titre}
                </p>
                <p className="text-sm leading-relaxed">{bloc.contenu}</p>
              </div>
            ))}
          </div>

          {!validated ? (
            <div className="space-y-3">
              <Button
                onClick={handleValidate}
                disabled={isSubmitting}
                className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enregistrement...</>
                ) : (
                  <>C&apos;est bien moi <ArrowRight className="ml-2 w-5 h-5" /></>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onPrev}
                className="w-full h-12 rounded-full text-sm"
              >
                Pas tout à fait, je veux ajuster
              </Button>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-2xl p-6 text-center space-y-4">
              <FeelyMascot variant="purple" size="md" className="mx-auto" speechBubble="Top !" />
              <p className="text-sm leading-relaxed">
                Je commence à bien te connaître ! Maintenant, montre-moi une offre
                qui t&apos;attire et je te dis honnêtement si elle est vraiment faite pour toi.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
