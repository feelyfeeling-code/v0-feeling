'use client'

import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { X } from 'lucide-react'

interface WelcomePopupProps {
  firstName: string
  onClose: () => void
}

export function WelcomePopup({ firstName, onClose }: WelcomePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative bg-background rounded-3xl p-8 max-w-lg w-full shadow-lg border border-border">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="pt-4">
          <p className="text-muted-foreground mb-2">
            Feely a bien reçu tout ce qu&apos;il faut pour te connaître.
          </p>
          <p className="text-muted-foreground mb-6">
            Tu es prêt(e) pour la suite !
          </p>
          
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            La chasse aux premiers postes peut commencer.
          </h2>
          
          <p className="text-muted-foreground mb-8">
            Feely analysera si elles te ressemblent vraiment.
          </p>
          
          <div className="flex items-end justify-between">
            <Button
              onClick={onClose}
              className="h-14 px-8 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
            >
              Tester une offre
            </Button>
            
            <FeelyMascot variant="blue" size="lg" speechBubble="C'est parti !" />
          </div>
        </div>
      </div>
    </div>
  )
}
