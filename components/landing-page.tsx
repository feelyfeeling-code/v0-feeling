'use client'

import { Button } from '@/components/ui/button'
import { FeelingLogo, FeelingLogoInline } from './feeling-logo'
import { FeelyMascot } from './feely-mascot'
import { Footer } from './footer'
import { ArrowRight, CheckCircle2, Sparkles, Heart, Target } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="lg" />
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              asChild
            >
              <Link href="/connexion">Se connecter</Link>
            </Button>
            <Button 
              asChild
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Link href="/inscription">S&apos;inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                Le bon job, c&apos;est celui avec lequel tu as un bon{' '}
                <FeelingLogoInline color="var(--color-primary)" heightEm={1.1} />
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
                Feeling t&apos;aide à trouver un job qui te ressemble vraiment. 
                Pas juste un job qui coche les cases, un job qui colle avec ta personnalité et tes valeurs.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 text-lg px-8"
                >
                  <Link href="/inscription">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  asChild
                  className="text-lg px-8"
                >
                  <Link href="#comment-ca-marche">
                    Comment ça marche ?
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <FeelyMascot variant="purple" size="xl" speechBubble="Salut ! Je suis Feely" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Feeling Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-background rounded-3xl p-8 md:p-12 shadow-sm border border-border">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <FeelyMascot variant="blue" size="lg" speechBubble="Ici Feely" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  <FeelingLogoInline />, qu&apos;est-ce que c&apos;est ?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Feeling, c&apos;est ton allié dans ta recherche d&apos;emploi. Il t&apos;aide à 
                  trouver un job qui te ressemble vraiment. Pas juste un job qui coche 
                  les cases, un job qui colle avec ta personnalité et tes valeurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="comment-ca-marche" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-secondary rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">On a appris à te connaître</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tu as répondu à quelques questions sur ta personnalité, tes valeurs et 
                  tes ambitions. Pas ton CV, toi. Et c&apos;est là que tout commence.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative md:mt-12">
              <div className="bg-primary/30 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Tu testes une offre</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Colle le lien d&apos;une offre qui t&apos;intéresse. Feely analyse si elle te 
                  ressemble vraiment.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative md:mt-24">
              <div className="bg-accent/30 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Tu vois les résultats</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tu verras si cette offre te ressemble vraiment sur ta personnalité, la 
                  culture de l&apos;entreprise et tes compétences.
                </p>
                <div className="flex gap-2 mt-4">
                  <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  <div className="w-6 h-6 rounded border-2 border-muted-foreground/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Pourquoi utiliser Feeling ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analyse personnalisée</h3>
              <p className="text-muted-foreground text-sm">
                Une analyse basée sur ta personnalité unique, pas des critères génériques.
              </p>
            </div>
            
            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Valeurs alignées</h3>
              <p className="text-muted-foreground text-sm">
                Découvre si la culture d&apos;entreprise correspond à tes valeurs profondes.
              </p>
            </div>
            
            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Points d&apos;attention</h3>
              <p className="text-muted-foreground text-sm">
                Identifie les aspects à surveiller avant de postuler.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <FeelyMascot variant="happy" size="lg" className="mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à trouver un job qui te ressemble ?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Rejoins Feeling et découvre si tes prochaines opportunités sont vraiment faites pour toi.
            </p>
            <Button 
              size="lg" 
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 text-lg px-10"
            >
              <Link href="/inscription">
                Commencer maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
