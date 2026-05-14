'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FeelingLogoInline } from '@/components/feeling-logo'
import { AuthHeader } from '@/components/auth-header'
import { FeelyMascot } from '@/components/feely-mascot'
import { Footer } from '@/components/footer'
import { WelcomePopup } from './welcome-popup'
import { Link2, ArrowRight, Clock, Building2, Sparkles, FileText } from 'lucide-react'
import { computeOverallScore } from '@/lib/score'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { toast } from 'sonner'

function DailyLimitBadge({ count, limit }: { count: number; limit: number }) {
  const remaining = limit - count
  const exceeded = remaining <= 0

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-2 ml-3 ${
        exceeded
          ? 'bg-destructive/10 text-destructive'
          : remaining === 1
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      <span>
        {exceeded
          ? 'Limite atteinte — reviens demain !'
          : `${count}/${limit} analyses aujourd'hui`}
      </span>
    </div>
  )
}

interface RecentAnalysis {
  id: string
  job_title: string
  company_name: string
  personality_score: number
  values_score: number
  skills_score: number | null
  has_dealbreakers: boolean
  created_at: string
}

interface HomeDashboardProps {
  userId: string
  firstName: string
  recentAnalyses: RecentAnalysis[]
  dailyAnalysisCount: number
  dailyAnalysisLimit: number
  hasTechnicalProfile: boolean
}

export function HomeDashboard({ userId, firstName, recentAnalyses, dailyAnalysisCount, dailyAnalysisLimit, hasTechnicalProfile }: HomeDashboardProps) {
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

  const handleMockAnalysis = async (preset: string) => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/dev/mock-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preset }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      // no_skills suit le vrai flow : résultats rapides d'abord
      const route = preset === 'no_skills'
        ? `/resultats/${data.analysisId}`
        : `/resultats-complets/${data.analysisId}`
      router.push(route)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur mock')
      setIsAnalyzing(false)
    }
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
          setIsAnalyzing(false)
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

      // Si le profil technique est rempli, /api/analyze a déjà intégré les
      // hard skills → on saute la vue rapide et on va sur les résultats complets.
      const includesSkills = data.hasTechnicalProfile ?? hasTechnicalProfile
      router.push(
        includesSkills
          ? `/resultats-complets/${data.analysisId}`
          : `/resultats/${data.analysisId}`
      )
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
      {/* Loading overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center px-4">
            <FeelyMascot variant="purple" size="xl" className="animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Feely analyse l&apos;offre&hellip;</h2>
              <p className="text-muted-foreground">Ça peut prendre quelques secondes, patience !</p>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      {/* Welcome popup */}
      {showWelcome && (
        <WelcomePopup 
          firstName={firstName} 
          onClose={() => setShowWelcome(false)} 
        />
      )}

      <AuthHeader />

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-12 md:py-20 relative ">
          {/* Decorative elements */}
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16">
              <div className="flex-1 z-10">
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
                        ? 'bg-background '
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Link2 className="w-4 h-4 " />
                    Coller une URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('paste')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      mode === 'paste'
                        ? 'bg-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Coller le texte
                  </button>
                </div>

                {/* Compteur d'analyses journalières */}
                <DailyLimitBadge count={dailyAnalysisCount} limit={dailyAnalysisLimit} />

                {mode === 'url' ? (
                  <form onSubmit={handleAnalyzeUrl} className="space-y-4">
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="www.feeling.com/offre-x"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="h-14 pl-13 text-base bg-background w-4xl"
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
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
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                        className="h-12"
                      />
                      <Input
                        placeholder="Entreprise *"
                        value={pastedCompany}
                        onChange={(e) => setPastedCompany(e.target.value)}
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="Lieu (optionnel)"
                        value={pastedLocation}
                        onChange={(e) => setPastedLocation(e.target.value)}
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                        className="h-12"
                      />
                      <Input
                        placeholder="Type de contrat (CDI, CDD...)"
                        value={pastedType}
                        onChange={(e) => setPastedType(e.target.value)}
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                        className="h-12"
                      />
                      <Input
                        placeholder="Télétravail (full remote, hybride...)"
                        value={pastedRemote}
                        onChange={(e) => setPastedRemote(e.target.value)}
                        disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                        className="h-12"
                      />
                    </div>
                    <Textarea
                      placeholder="Colle ici le texte complet de l'offre d'emploi (missions, profil recherché, compétences, avantages...) *"
                      value={pastedDescription}
                      onChange={(e) => setPastedDescription(e.target.value)}
                      disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
                      className="min-h-[240px] text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={isAnalyzing || dailyAnalysisCount >= dailyAnalysisLimit}
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
              
                  <div className="flex-shrink-0 hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/3">
                
                    <img 
                      src="/image-bg-landing.svg" 
                      className="max-h-2xl lg:block hidden "
                    />
              </div>
            </div>
          </div>
        </section>
    {/* Recent analyses */}
        {recentAnalyses.length > 0 && (
          <section className="my-12 z-10 relative">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Voici tes dernières analyses :</h2>

              <div className="flex flex-col gap-4">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/resultats-complets/${analysis.id}`}
                    className="bg-background rounded-2xl px-6 py-5 border border-border hover:border-primary hover:bg-primary/10 transition-colors flex items-center justify-between gap-6 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Date de l&apos;analyse :{' '}
                        {new Date(analysis.created_at).toLocaleDateString(
                          'fr-FR',
                        )}
                      </p>
                      <h3 className="font-bold text-base sm:text-lg uppercase tracking-wide truncate">
                        {analysis.job_title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {analysis.company_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-2xl sm:text-3xl font-bold">
                        {computeOverallScore(analysis)}%
                      </span>
                      <ArrowRight className="w-6 h-6 text-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        
      {/* What is Feeling Section */}
      <section className="mt-20 pb-10 z-10 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-background rounded-3xl p-8 md:p-12 border border-primary">
            <div className="flex flex-col md:flex-row items-center lg:gap-20">
              <div className="flex-shrink-0 ml-10">
                <FeelyMascot variant="blue" size="lg" speechBubble="Ici Feely" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  <FeelingLogoInline heightEm={1.4} color="var(--color-primary)" className='mr-0.5'/>
                   , qu&apos;est-ce que c&apos;est ?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
Feeling, c’est simple : tu trouves une offre en ligne, tu la colles ici, et Feely analyse les missions, la culture, les valeurs et les attentes du poste pour t’expliquer concrètement si cette offre te correspond vraiment… ou non.                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* How it works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Comment ça marche ?</h2>
            
          <div className="grid md:grid-cols-4 gap-8 mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-secondary rounded-2xl p-6 lg:h-auto h-60 ">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Parle-nous de toi</h3>
                <p className="text-foreground text-sm leading-relaxed">
             Tu réponds à quelques questions sur ta personnalité, tes valeurs et ce que tu recherches vraiment dans un job.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-info rounded-2xl p-6 lg:h-auto h-60 mt-8">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Partage une offre</h3>
                <p className="text-foreground text-sm leading-relaxed">
         Tu colles le lien d’une offre trouvée en ligne pour que Feely puisse regarder si elle te correspond vraiment.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="bg-accent rounded-2xl p-6 lg:h-auto h-60 mt-16">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Découvre ton feeling</h3>
                <p className="text-foreground text-sm leading-relaxed">
        Feely analyse l’offre et t’explique clairement ce qui colle avec ton profil, ce qui crée un écart et pourquoi.
                </p>

              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-primary rounded-2xl p-6 lg:h-auto h-60 mt-24">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="text-xl font-bold mb-3">Prépare ta candidature</h3>
                <p className="text-foreground text-sm leading-relaxed">
Tu génères un CV et une lettre de motivation adaptés à ton profil et à l’offre pour candidater avec plus de confiance.
                </p>
              </div>
            </div>
          </div>
          </div>
        </section>

      </main>

      {/* DEV ONLY — panneau de mock analyse */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-xl max-w-xs">
          <p className="text-xs font-bold text-yellow-800 mb-3 uppercase tracking-wide">⚙️ Dev — Mock analyse</p>
          <div className="flex flex-col gap-2">
            {[
              { preset: 'good', label: '✅ Bon match (78%)' },
              { preset: 'average', label: '🟡 Match moyen (51%)' },
              { preset: 'bad', label: '❌ Mauvais match + dealbreakers' },
              { preset: 'no_skills', label: '🔧 Sans profil technique' },
            ].map(({ preset, label }) => (
              <button
                key={preset}
                onClick={() => handleMockAnalysis(preset)}
                disabled={isAnalyzing}
                className="text-xs text-left px-3 py-2 rounded-lg bg-yellow-200 hover:bg-yellow-300 font-medium text-yellow-900 disabled:opacity-50 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
