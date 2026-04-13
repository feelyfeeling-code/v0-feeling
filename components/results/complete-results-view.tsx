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
  Send,
  RefreshCw,
  CheckCircle2,
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

interface CompleteResultsViewProps {
  analysis: Analysis
}

// US 15.1 : verdict précis sur 3 niveaux.
function getVerdict(score: number): {
  label: 'Fort potentiel' | 'Match partiel' | 'Faible adéquation'
  tone: 'strong' | 'partial' | 'weak'
  headline: string
} {
  if (score >= 70) {
    return {
      label: 'Fort potentiel',
      tone: 'strong',
      headline: 'Super feeling sur le profil complet',
    }
  }
  if (score >= 40) {
    return {
      label: 'Match partiel',
      tone: 'partial',
      headline: 'Bon feeling mais points à travailler',
    }
  }
  return {
    label: 'Faible adéquation',
    tone: 'weak',
    headline: 'Cette offre colle peu avec ton profil',
  }
}

// Badge circulaire avec score et mascot.
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

// Barre dégradée rouge → jaune → vert avec curseur au score.
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

// Carte "section" dépliable (ouverte par défaut).
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

export function CompleteResultsView({ analysis }: CompleteResultsViewProps) {
  const router = useRouter()

  // US 15.1 : pondération 50% soft (personnalité + valeurs) + 50% hard (compétences).
  // Soft = moyenne simple des deux dimensions soft ; Hard = skills_score.
  const hasSkills = analysis.skills_score !== null
  const softScore = Math.round(
    (analysis.personality_score + analysis.values_score) / 2,
  )
  const hardScore = analysis.skills_score ?? 0
  const rawCombined = hasSkills
    ? Math.round(softScore * 0.5 + hardScore * 0.5)
    : softScore

  // Dealbreaker cap à 30/100 appliqué après pondération.
  const effectiveOverall = analysis.has_dealbreakers
    ? Math.min(rawCombined, 30)
    : rawCombined

  const verdict = getVerdict(effectiveOverall)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const verdictBadgeClass =
    verdict.tone === 'strong'
      ? 'bg-accent/30 text-foreground'
      : verdict.tone === 'partial'
        ? 'bg-primary/30 text-foreground'
        : 'bg-destructive/10 text-destructive'

  // US 15.2 : explication = 2-3 phrases depuis strengths[] (générées par l'IA
  // avec contraintes : 1 élément profil + 1 élément offre, action concrète si score faible).
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
          <div className="flex items-center gap-3">
            <Link href="/accueil">
              <Button variant="outline" size="sm">
                Nouvelle analyse
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* US 15.1 : bandeau rouge si rédhibitoire détecté */}
        {analysis.has_dealbreakers && (
          <div className="bg-destructive/10 border-b border-destructive/20">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Critère rédhibitoire détecté :{' '}
                {analysis.dealbreaker_details?.join(', ') ?? 'non spécifié'}.
                Score global plafonné à 30/100.
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
          {/* Badge analyse complète */}
          <div className="inline-flex items-center gap-2 bg-accent/30 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Analyse complète · Soft skills + Hard skills
          </div>

          {/* Titre */}
          <h1 className="text-3xl md:text-4xl font-extrabold border-b border-border pb-3">
            Ton feeling complet avec cette offre
          </h1>

          {/* Récapitulatif de l'offre */}
          <section className="space-y-3">
            <h2 className="font-bold">Récapitulatif de l&apos;offre :</h2>
            <div className="flex flex-wrap gap-2">
              {(analysis.job_title || analysis.company_name) && (
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm">
                  {analysis.job_title}
                  {analysis.company_name ? ` chez ${analysis.company_name}` : ''}
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

          <p className="text-sm text-muted-foreground">
            Analyse finale combinant ta personnalité, tes valeurs et tes compétences
            techniques (pondération 50% soft / 50% hard).
          </p>

          {/* US 15.1 : score global en grand + barre + verdict */}
          <section className="space-y-6 flex flex-col items-center">
            <BigScoreBadge score={effectiveOverall} />
            <GradientBar score={effectiveOverall} />
            <div className="flex flex-col items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold',
                  verdictBadgeClass,
                )}
              >
                {verdict.label}
              </span>
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
            </div>
          </section>

          {/* Breakdown soft/hard */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Soft skills</p>
              <p className="text-3xl font-extrabold">{softScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Personnalité + Valeurs
              </p>
            </div>
            <div className="rounded-2xl bg-accent/20 border border-accent/30 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hard skills</p>
              <p className="text-3xl font-extrabold">
                {hasSkills ? `${hardScore}%` : '–'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compétences + Expériences
              </p>
            </div>
          </section>

          {/* US 15.2 : explication personnalisée en 2-3 phrases */}
          {matchExplanation.length > 0 && (
            <section className="rounded-2xl bg-muted/30 p-5 space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                Pourquoi ce score ?
              </h3>
              {matchExplanation.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {line}
                </p>
              ))}
            </section>
          )}

          {/* Sections détaillées */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard
              title="Personnalité"
              score={analysis.personality_score}
              strengths={analysis.personality_analysis?.strengths ?? []}
              attentionPoints={
                analysis.personality_analysis?.attentionPoints ?? []
              }
            />
            <SectionCard
              title="Valeurs & Culture"
              score={analysis.values_score}
              strengths={analysis.values_analysis?.strengths ?? []}
              attentionPoints={analysis.values_analysis?.attentionPoints ?? []}
            />
            {hasSkills && analysis.skills_analysis ? (
              <SectionCard
                title="Compétences"
                score={analysis.skills_score!}
                strengths={analysis.skills_analysis.strengths ?? []}
                attentionPoints={analysis.skills_analysis.attentionPoints ?? []}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 flex flex-col justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">Compétences</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Score non disponible — ton profil technique n&apos;a pas encore
                    été analysé.
                  </p>
                </div>
                <Link href={`/profil-technique?from=${analysis.id}`}>
                  <Button size="sm" variant="outline" className="w-full">
                    Compléter mon profil
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Actions finales */}
          <section className="flex flex-col sm:flex-row gap-3 pt-2">
            {analysis.job_url && (
              <a
                href={analysis.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium">
                  <Send className="w-4 h-4 mr-2" />
                  Postuler à cette offre
                </Button>
              </a>
            )}
            <Link href="/accueil" className="flex-1">
              <Button variant="outline" className="w-full h-12 font-medium">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tester une nouvelle offre
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
