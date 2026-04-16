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
                Tu n&apos;as pas fait 5 ans d&apos;études pour finir{' '}
                <span className="italic">n&apos;importe où</span>.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
                <FeelingLogoInline color="var(--color-primary)" heightEm={1} /> décode les offres d&apos;emploi pour les Bac+5.
                On regarde si la boîte te ressemble — pas si ton CV rentre dans la case.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 text-lg px-8"
                >
                  <Link href="/inscription">
                    Commencer — c&apos;est gratuit
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
                    Le mode d&apos;emploi
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="relative">
                <FeelyMascot variant="purple" size="xl" speechBubble="Décodeur d'offres, bonjour" />
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
                <FeelyMascot variant="blue" size="lg" speechBubble="Je lis entre les lignes" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  C&apos;est quoi <FeelingLogoInline /> au juste ?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Un outil pour les jeunes diplômé·es qui en ont marre de postuler dans le vide.
                  Tu colles une offre, on la passe au filtre de <em>qui tu es</em> — pas de ce que
                  ton CV raconte. Résultat : tu sais en 30 secondes si la boîte vaut ta lettre de motivation.
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
                <h3 className="text-xl font-bold mb-3">On prend ton empreinte</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Dix minutes de questions sur qui tu es, ce que tu supportes,
                  ce que tu viens chercher après 5 ans d&apos;études. Pas ton CV — toi.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative md:mt-12">
              <div className="bg-primary/30 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Tu balances une offre</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Le lien d&apos;une annonce qui t&apos;attire (ou t&apos;intrigue, ou t&apos;angoisse).
                  Feely la passe au scanner en quelques secondes.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative md:mt-24">
              <div className="bg-accent/30 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Le verdict tombe</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Un score, les vrais points communs, les red flags, et les trucs
                  que le jargon RH avait glissés sous le tapis. À toi de décider.
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Pensé pour les Bac+5 qui cherchent leur premier poste
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Pas un énième agrégateur. Pas un coach. Un radar à bullshit calibré pour les jeunes diplômé·es.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">On traduit les offres</h3>
              <p className="text-muted-foreground text-sm">
                &quot;Environnement challengeant&quot; veut dire quoi chez eux ? On te le dit.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">On repère les red flags</h3>
              <p className="text-muted-foreground text-sm">
                &quot;Famille soudée&quot;, &quot;esprit startup&quot;, &quot;mission polyvalente&quot; : on sait ce qui se cache derrière.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-8 shadow-sm border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">On calibre pour Bac+5</h3>
              <p className="text-muted-foreground text-sm">
                Salaire, autonomie, formation : on analyse au niveau d&apos;un premier poste, pas au niveau &quot;5 ans d&apos;XP&quot;.
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
              Allez, on arrête de postuler à l&apos;aveugle ?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Dix minutes pour te présenter. Et ensuite, chaque offre passe au filtre.
              Ton premier poste mérite mieux qu&apos;un coup de dé.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 text-lg px-10"
            >
              <Link href="/inscription">
                Je crée mon profil
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
