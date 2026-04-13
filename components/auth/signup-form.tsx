'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FeelyMascot } from '@/components/feely-mascot'
import { FeelingLogo } from '@/components/feeling-logo'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type Step = 1 | 2

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  
  // Step 1: Basic info
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  
  // Step 2: Password & consents
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptNewsletter, setAcceptNewsletter] = useState(false)

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) {
      toast.error('Ton prénom est requis')
      return
    }
    if (!email.trim()) {
      toast.error('Ton email est requis')
      return
    }
    setStep(2)
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    
    if (!acceptTerms) {
      toast.error('Tu dois accepter les conditions d\'utilisation')
      return
    }
    
    setIsLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
          `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          accept_newsletter: acceptNewsletter,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success('Compte créé ! Bienvenue sur Feeling.')
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md relative">
        {/* Close button */}
        <Link 
          href="/" 
          className="absolute -top-12 left-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 1 ? (
          <div className="flex flex-col items-center">
            <FeelyMascot variant="blue" size="lg" className="mb-6" />
            
            <h1 className="text-3xl font-bold text-center mb-2">
              Bienvenue !
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Créons ton compte ensemble
            </p>

            <form onSubmit={handleStep1} className="w-full space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Comment tu t&apos;appelles ?</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Ton prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Ton adresse email :</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="feeling@good.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 text-lg font-medium"
              >
                Continuer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">Déjà un compte ?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              asChild
              className="w-full h-14 text-lg font-medium"
            >
              <Link href="/connexion">Se connecter</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FeelingLogo size="lg" className="mb-6" asLink={false} />
            
            <h1 className="text-2xl font-bold text-center mb-2">
              Parfait {firstName} !
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Plus qu&apos;une étape pour commencer
            </p>

            <form onSubmit={handleStep2} className="w-full space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Choisis un mot de passe :</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme ton mot de passe :</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    J&apos;accepte les{' '}
                    <Link href="/cgu" className="text-primary hover:underline">
                      conditions générales d&apos;utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/confidentialite" className="text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="newsletter"
                    checked={acceptNewsletter}
                    onCheckedChange={(checked) => setAcceptNewsletter(checked as boolean)}
                  />
                  <Label htmlFor="newsletter" className="text-sm leading-relaxed cursor-pointer">
                    Je souhaite recevoir des conseils et actualités de Feeling par email
                  </Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-14"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-14 bg-foreground text-background hover:bg-foreground/90 text-lg font-medium"
                >
                  {isLoading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
