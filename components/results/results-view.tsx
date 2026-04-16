'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FeelyMascot } from '@/components/feely-mascot'
import { FeelingLogo } from '@/components/feeling-logo'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'

interface Analysis {
  id: string
  job_title: string
  company_name: string
  job_location: string
  job_type: string
  job_remote: string
  job_url: string
  overall_score: number
  personality_score: number
  values_score: number
  skills_score: number | null
  personality_analysis: { strengths: string[]; attentionPoints: string[] }
  values_analysis: { strengths: string[]; attentionPoints: string[] }
  skills_analysis: { strengths: string[]; attentionPoints: string[] } | null
  strengths: string[]
  attention_points: string[]
  has_dealbreakers: boolean
  dealbreaker_details: string[] | null
}

interface ResultsViewProps {
  analysis: Analysis
  hasTechnicalProfile: boolean | null
  userId: string
}

// US 13.1 : verdict clair dérivé du score global.
function getVerdict(score: number): {
  label: string
  tone: 'strong' | 'partial' | 'weak'
  headline: string
} {
  if (score >= 70) {
    return {
      label: 'Ça vaut le coup',
      tone: 'strong',
      headline: 'Sur ta personnalité et tes valeurs, le courant passe bien.',
    }
  }
  if (score >= 40) {
    return {
      label: 'À creuser',
      tone: 'partial',
      headline: 'Des points d’accroche, mais quelques zones à éclairer en entretien.',
    }
  }
  return {
    label: 'Mieux vaut passer',
    tone: 'weak',
    headline: 'Sur l’essentiel, l’annonce ne colle pas à ton profil.',
  }
}

// Badge circulaire avec le score en gros (inspiré de la maquette)
function BigScoreBadge({ score }: { score: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-primary/30 via-secondary to-accent/40 flex items-center justify-center">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <FeelyMascot variant="purple" size="sm" />
        </div>
        <div className="text-center mt-4">
          <div className="text-5xl font-extrabold leading-none">{score}%</div>
        </div>
      </div>
    </div>
  )
}

// Barre dégradée rouge → jaune → vert avec curseur positionné sur le score.
function GradientBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-green-400" />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-background border-2 border-foreground shadow"
        style={{ left: `${clamped}%` }}
        aria-hidden
      />
    </div>
  )
}

// Carte "section" dépliable (par défaut ouverte).
function SectionCard({
  title,
  score,
  strengths,
  attentionPoints,
}: {
  title: string
  score: number
  strengths: string[]
  attentionPoints: string[]
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-base">{title}</span>
          <span className="font-bold text-base text-primary">{score}%</span>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-primary/20 pt-4 space-y-4">
          {strengths.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">Points forts</p>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                {strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {attentionPoints.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">Points d&apos;attention</p>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                {attentionPoints.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ResultsView({ analysis, hasTechnicalProfile, userId }: ResultsViewProps) {
  const router = useRouter()
  const verdict = getVerdict(analysis.overall_score)
  const [isMockCompleting, setIsMockCompleting] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleMockComplete = async (userId: string) => {
    setIsMockCompleting(true)
    try {
      const response = await fetch('/api/dev/mock-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: analysis.id, userId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      router.push(`/resultats-complets/${analysis.id}`)
    } catch (error) {
      console.error(error)
      setIsMockCompleting(false)
    }
  }

  // US 13.2 : les phrases "Pourquoi ça match" viennent du champ strengths[].
  const matchExplanation =
    analysis.strengths && analysis.strengths.length > 0
      ? analysis.strengths
      : []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="md" />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Dealbreaker warning */}
        {analysis.has_dealbreakers && (
          <div className="bg-destructive/10 border-b border-destructive/20">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Un ou plusieurs de tes dealbreakers apparaissent dans l&apos;annonce :{' '}
                {analysis.dealbreaker_details?.join(', ')}. Score plafonné à 30/100.
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
          {/* Titre */}
          <h1 className="text-3xl md:text-4xl font-extrabold border-b border-border pb-3">
            Le verdict sur cette offre
          </h1>

          {/* Récapitulatif de l'offre */}
          <section className="space-y-3">
            <h2 className="font-bold">L&apos;annonce, en une ligne :</h2>
            <div className="flex flex-wrap gap-2">
              {(analysis.job_title || analysis.company_name) && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.job_title}
                  {analysis.company_name ? ` chez ${analysis.company_name}` : ''}
                </span>
              )}
              {analysis.company_name && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.company_name}
                </span>
              )}
              {analysis.job_type && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.job_type}
                </span>
              )}
              {analysis.job_location && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.job_location}
                </span>
              )}
              {analysis.job_remote && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.job_remote}
                </span>
              )}
              {analysis.job_url && (
                <a
                  href={analysis.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-sm text-primary font-medium hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir l&apos;offre
                </a>
              )}
            </div>
          </section>

          {/* Intro analyse phase 1 */}
          <p className="text-sm text-muted-foreground">
            Première passe : on regarde ce qui compte le plus pour un premier poste —
            ta personnalité, tes valeurs et la culture affichée par la boîte.
          </p>

          {/* Score global + gradient bar */}
          <section className="space-y-6 flex flex-col items-center">
            <BigScoreBadge score={analysis.overall_score} />
            <GradientBar score={analysis.overall_score} />
            <p
              className={cn(
                'text-xl md:text-2xl font-extrabold text-center',
                verdict.tone === 'strong' && 'text-accent-foreground',
                verdict.tone === 'partial' && 'text-primary',
                verdict.tone === 'weak' && 'text-destructive',
              )}
            >
              {verdict.headline}
            </p>
          </section>

          {/* Pourquoi ça match (US 13.2) */}
          {matchExplanation.length > 0 && (
            <section className="text-sm leading-relaxed space-y-2">
              {matchExplanation.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </section>
          )}

          {/* Sections détaillées (US 13.3 + 13.4) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard
              title="Personnalité"
              score={analysis.personality_score}
              strengths={analysis.personality_analysis?.strengths ?? []}
              attentionPoints={analysis.personality_analysis?.attentionPoints ?? []}
            />
            <SectionCard
              title="Valeurs & Culture"
              score={analysis.values_score}
              strengths={analysis.values_analysis?.strengths ?? []}
              attentionPoints={analysis.values_analysis?.attentionPoints ?? []}
            />
          </section>

          {/* CTA compléter profil technique (US 13.5 + 13.6) */}
          {!hasTechnicalProfile ? (
            <section className="rounded-3xl bg-primary/30 p-6 md:p-8 flex flex-col items-center text-center gap-4">
              <p className="text-base md:text-lg font-medium max-w-xl">
                Ajoute tes stages, ton alternance et tes vraies compétences pour voir
                si la fiche de poste tient aussi la route côté technique.
              </p>
              <Link href={`/profil-technique?from=${analysis.id}`}>
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base font-bold"
                >
                  Ajouter mon expérience concrète
                </Button>
              </Link>
            </section>
          ) : (
            <section className="rounded-3xl bg-accent/30 p-6 md:p-8 flex flex-col items-center text-center gap-4">
              <p className="text-base md:text-lg font-medium max-w-xl">
                Ton expérience concrète est déjà enregistrée. Passe à l&apos;analyse
                complète — on y ajoute le match sur les compétences attendues.
              </p>
              <Link href={`/resultats-complets/${analysis.id}`}>
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-base font-bold"
                >
                  Voir l&apos;analyse complète
                </Button>
              </Link>
            </section>
          )}
        </div>
      </main>

      {/* DEV ONLY — finaliser l'analyse avec mock skills */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-xl max-w-xs">
          <p className="text-xs font-bold text-yellow-800 mb-3 uppercase tracking-wide">⚙️ Dev — Finaliser le mock</p>
          <button
            onClick={() => handleMockComplete(userId)}
            disabled={isMockCompleting}
            className="w-full text-xs px-3 py-2 rounded-lg bg-yellow-200 hover:bg-yellow-300 font-medium text-yellow-900 disabled:opacity-50 transition-colors"
          >
            {isMockCompleting ? 'En cours...' : '🔧 Ajouter mock skills → résultats complets'}
          </button>
        </div>
      )}

      <Footer />
    </div>
  )
}
