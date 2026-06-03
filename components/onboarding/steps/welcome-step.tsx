'use client'

import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowRight, Clock } from 'lucide-react'

interface WelcomeStepProps {
  firstName: string
  onNext: () => void
}

export function WelcomeStep({ firstName, onNext }: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <FeelyMascot
        variant="purple"
        size="xl"
        className="mx-auto mb-8"
        speechBubble={`Salut ${firstName} !`}
      />

      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        Bienvenue sur Feeling !
      </h1>

      <div className="bg-muted/50 rounded-2xl p-6 mb-8 text-left">
        <p className="text-base leading-relaxed">
          Pour t&apos;aider dans ta recherche, j&apos;ai besoin d&apos;en
          savoir plus sur toi : tes passions, tes aspirations,
          ce pour quoi tu es doué(e)... On y va&nbsp;?
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
        <Clock className="w-4 h-4" />
        <span>Environ 7 minutes</span>
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="bg-foreground text-background hover:bg-foreground/90 text-lg px-8"
      >
        C&apos;est parti !
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  )
}
