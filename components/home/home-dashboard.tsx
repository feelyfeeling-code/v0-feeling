'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FeelingLogo } from '@/components/feeling-logo'
import { FeelyMascot } from '@/components/feely-mascot'
import { Footer } from '@/components/footer'
import { WelcomePopup } from './welcome-popup'
import { Link2, ArrowRight, Clock, Building2, Sparkles, FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { toast } from 'sonner'

interface RecentAnalysis {
  id: string
  job_title: string
  company_name: string
  overall_score: number
  created_at: string
}

interface HomeDashboardProps {
  userId: string
  firstName: string
  recentAnalyses: RecentAnalysis[]
}

export function HomeDashboard({ userId, firstName, recentAnalyses }: HomeDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobUrl, setJobUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Mode manuel : quand le scraping échoue ou que l'utilisateur préfère coller le texte.
  const [mode, setMode] = useState<'url' | 'paste'>('url')
  const [pastedTitle, setPastedTitle] = useState('')
  const [pastedCompany, setPastedCompany] = useState('')
  const [pastedDescription, setPastedDescription] = useState('')
  const [pastedLocation, setPastedLocation] = useState('')
  const [pastedType, setPastedType] = useState('')
  const [pastedRemote, setPastedRemote] = useState('')

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true)
      // Clean up URL
      window.history.replaceState({}, '', '/accueil')
    }
  }, [searchParams])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const submitAnalysis = async (body: Record<string, unknown>) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si le scraping a échoué, on propose automatiquement le mode manuel.
        if (data.code === 'SCRAPE_FAILED') {
          toast.error(data.error)
          setMode('paste')
          return
        }
        // Limite journalière atteinte
        if (data.code === 'DAILY_LIMIT_EXCEEDED') {
          toast.error(data.error, { duration: 6000 })
          setIsAnalyzing(false)
          return
        }
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      router.push(`/resultats/${data.analysisId}`)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse')
      setIsAnalyzing(false)
    }
  }

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobUrl.trim()) {
      toast.error('Colle le lien d\'une offre d\'emploi')
      return
    }

    try {
      new URL(jobUrl)
    } catch {
      toast.error('Ce n\'est pas un lien valide')
      return
    }

    await submitAnalysis({ url: jobUrl })
  }

  const handleAnalyzePasted = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pastedDescription.trim()) {
      toast.error('Colle le texte de l\'offre')
      return
    }
    if (!pastedTitle.trim()) {
      toast.error('Précise l\'intitulé du poste')
      return
    }
    if (!pastedCompany.trim()) {
      toast.error('Précise le nom de l\'entreprise')
      return
    }

    await submitAnalysis({
      rawOffer: {
        title: pastedTitle,
        company: pastedCompany,
        description: pastedDescription,
        location: pastedLocation,
        type: pastedType,
        remote: pastedRemote,
        url: jobUrl || undefined,
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Welcome popup */}
      {showWelcome && (
        <WelcomePopup 
          firstName={firstName} 
          onClose={() => setShowWelcome(false)} 
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="md" />
          
          <Button variant="outline" onClick={handleSignOut}>
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-12 md:py-20 relative overflow-hidden">
          {/* Decorative elements */}
          <svg 
            className="absolute top-10 right-20 w-16 h-16 text-accent hidden md:block"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M10 90 L90 50 L10 10 L30 50 Z" opacity="0.6" />
          </svg>
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Cette offre, est-elle faite pour toi ?
                </h1>
                <p className="text-muted-foreground mb-6">
                  Colle le lien de l&apos;offre et voyons si le job te correspond vraiment !
                </p>

                {/* Toggle URL / Coller */}
                <div className="inline-flex rounded-full bg-muted p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      mode === 'url'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    Coller une URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('paste')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      mode === 'paste'
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Coller le texte
                  </button>
                </div>

                {mode === 'url' ? (
                  <form onSubmit={handleAnalyzeUrl} className="space-y-4">
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="www.feeling.com/offre-x"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="h-14 pl-12 text-base"
                        disabled={isAnalyzing}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isAnalyzing}
                      className="h-14 px-8 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
                    >
                      {isAnalyzing ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                          Analyse en cours...
                        </>
                      ) : (
                        'Lancer le matching'
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      Site protégé ou scraping impossible ?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('paste')}
                        className="text-primary font-medium hover:underline"
                      >
                        Colle plutôt le texte de l&apos;offre
                      </button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleAnalyzePasted} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Intitulé du poste *"
                        value={pastedTitle}
                        onChange={(e) => setPastedTitle(e.target.value)}
                        disabled={isAnalyzing}
                        className="h-12"
                      />
                      <Input
                        placeholder="Entreprise *"
                        value={pastedCompany}
                        onChange={(e) => setPastedCompany(e.target.value)}
                        disabled={isAnalyzing}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="Lieu (optionnel)"
                        value={pastedLocation}
                        onChange={(e) => setPastedLocation(e.target.value)}
                        disabled={isAnalyzing}
                        className="h-12"
                      />
                      <Input
                        placeholder="Type de contrat (CDI, CDD...)"
                        value={pastedType}
                        onChange={(e) => setPastedType(e.target.value)}
                        disabled={isAnalyzing}
                        className="h-12"
                      />
                      <Input
                        placeholder="Télétravail (full remote, hybride...)"
                        value={pastedRemote}
                        onChange={(e) => setPastedRemote(e.target.value)}
                        disabled={isAnalyzing}
                        className="h-12"
                      />
                    </div>
                    <Textarea
                      placeholder="Colle ici le texte complet de l'offre d'emploi (missions, profil recherché, compétences, avantages...) *"
                      value={pastedDescription}
                      onChange={(e) => setPastedDescription(e.target.value)}
                      disabled={isAnalyzing}
                      className="min-h-[240px] text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={isAnalyzing}
                      className="h-14 px-8 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
                    >
                      {isAnalyzing ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                          Analyse en cours...
                        </>
                      ) : (
                        'Lancer le matching'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Champs marqués * obligatoires. Plus le texte est complet, meilleure sera l&apos;analyse.
                    </p>
                  </form>
                )}
              </div>
              
              <div className="flex-shrink-0 hidden lg:block">
                <FeelyMascot variant="purple" size="xl" />
              </div>
            </div>
          </div>
        </section>

        {/* What is Feeling section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-background rounded-3xl p-8 shadow-sm border border-border">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <FeelyMascot variant="blue" size="lg" speechBubble="Ici Feely" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    <span style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }}>feeling</span>, qu&apos;est-ce que c&apos;est ?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Feeling, c&apos;est Feely ton allié dans ta recherche d&apos;emploi. Il t&apos;aide à 
                    trouver un job qui te ressemble vraiment. Pas juste un job qui coche 
                    les cases, un job qui colle avec ta personnalité et tes valeurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Comment ça marche ?</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-secondary rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-bold mb-2">On a appris à te connaître</h3>
                <p className="text-sm text-muted-foreground">
                  Tu as répondu à quelques questions sur ta personnalité, tes valeurs et 
                  tes ambitions. Pas ton CV, toi. Et c&apos;est là que tout commence.
                </p>
              </div>
              
              <div className="bg-primary/30 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-bold mb-2">Tu testes une offre</h3>
                <p className="text-sm text-muted-foreground">
                  Colle le lien d&apos;une offre qui t&apos;intéresse. Feely analyse si elle te 
                  ressemble vraiment.
                </p>
              </div>
              
              <div className="bg-accent/30 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-bold mb-2">Tu vois les résultats</h3>
                <p className="text-sm text-muted-foreground">
                  Tu verras si cette offre te ressemble vraiment sur ta personnalité, la 
                  culture de l&apos;entreprise et tes compétences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent analyses */}
        {recentAnalyses.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Tes dernières analyses</h2>
              
              <div className="grid gap-4">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/resultats/${analysis.id}`}
                    className="bg-background rounded-xl p-6 border border-border hover:border-primary/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {analysis.job_title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{analysis.company_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{analysis.overall_score}%</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
