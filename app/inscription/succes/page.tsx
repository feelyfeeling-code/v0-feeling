import { FeelyMascot } from '@/components/feely-mascot'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Email envoyé - Feeling',
  description: 'Vérifie tes emails pour confirmer ton inscription',
}

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-accent" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          Vérifie tes emails !
        </h1>
        
        <p className="text-muted-foreground mb-8">
          On t&apos;a envoyé un email de confirmation. Clique sur le lien dans l&apos;email 
          pour activer ton compte et commencer l&apos;aventure !
        </p>
        
        <FeelyMascot variant="happy" size="lg" className="mx-auto mb-8" speechBubble="À tout de suite !" />
        
        <div className="space-y-4">
          <Button
            variant="outline"
            asChild
            className="w-full h-12"
          >
            <Link href="/connexion">Retour à la connexion</Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Tu n&apos;as pas reçu l&apos;email ?{' '}
            <button className="text-primary hover:underline">
              Renvoyer l&apos;email
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
