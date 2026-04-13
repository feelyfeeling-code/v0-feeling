'use client'

import { FeelingLogo } from './feeling-logo'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface HeaderProps {
  isAuthenticated?: boolean
  showAuth?: boolean
}

export function Header({ isAuthenticated = false, showAuth = true }: HeaderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <FeelingLogo size="md" />
        
        {showAuth && (
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                disabled={isLoading}
              >
                {isLoading ? 'Déconnexion...' : 'Déconnexion'}
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/connexion')}
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => router.push('/inscription')}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  S&apos;inscrire
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
