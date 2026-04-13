'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FeelyMascot } from '@/components/feely-mascot'
import { X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Email ou mot de passe incorrect')
      setIsLoading(false)
      return
    }

    toast.success('Connexion réussie !')
    router.push('/accueil')
    router.refresh()
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

        <div className="flex flex-col items-center">
          {/* Mascot */}
          <FeelyMascot variant="purple" size="lg" className="mb-6" />

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Ravi de te revoir !
          </h1>
          <p className="text-2xl font-bold text-center mb-8">
            Connecte-toi
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email :</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe :</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-medium"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">Pas encore de compte ?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign up link */}
          <Button
            variant="outline"
            asChild
            className="w-full h-14 text-lg font-medium"
          >
            <Link href="/inscription">S&apos;inscrire</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
