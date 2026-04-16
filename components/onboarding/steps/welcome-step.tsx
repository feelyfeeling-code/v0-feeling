'use client'

import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowRight, Clock, Brain, Heart, Target } from 'lucide-react'

interface WelcomeStepProps {
  firstName: string
  onNext: () => void
}

export function WelcomeStep({ firstName, onNext }: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <FeelyMascot variant="purple" size="xl" className="mx-auto mb-8" speechBubble={`Salut ${firstName} !`} />

      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Bienvenue sur Feeling !
      </h1>

      <p className="text-lg text-muted-foreground mb-8">
        Tu viens de passer 5 ans à te former. Prends 10 minutes pour te présenter autrement
        qu&apos;avec les bullet points de ton CV — et Feeling saura dire si une offre vaut le coup.
      </p>

      {/* What we'll cover */}
      <div className="bg-muted/50 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold mb-4 text-left">Au programme :</h2>
        <div className="grid gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Comment tu fonctionnes</p>
              <p className="text-sm text-muted-foreground">Au-delà des &quot;qualités&quot; qu&apos;on liste en entretien</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Ce que tu viens chercher</p>
              <p className="text-sm text-muted-foreground">Et ce que tu refuses de subir, même pour un premier poste</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Où tu veux atterrir</p>
              <p className="text-sm text-muted-foreground">Secteur, poste, salaire — la version honnête</p>
            </div>
          </div>
        </div>
      </div>


      <Button
        onClick={onNext}
        size="lg"
        className="bg-foreground text-background hover:bg-foreground/90 text-lg px-8"
      >
        On y va
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  )
}
