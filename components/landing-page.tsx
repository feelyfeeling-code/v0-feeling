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
      <header className="w-full bg-background sticky top-0 z-50 mt-4">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="md" className="mt-4" color='var(--color-primary)'/>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="lg"
              asChild
            >
              <Link href="/connexion">Se connecter</Link>
            </Button>
            <Button 
              asChild
              className="bg-primary text-foreground hover:bg-primary/90"
              size="lg"
            >
              <Link href="/inscription">S&apos;inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 overflow-hidden">
        <div className="container mx-auto ">  
          <div className="flex flex-col lg:flex-row gap-50">
            <div className="flex-2 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-[50px] font-bold">
                Et si finalement, c'était l'entreprise qui ne te correspondait pas ? 
              </h1>
              <p className="mt-6 text-lg  md:text-xl text-muted-foreground max-w-2xl">
Tu as fini ton Bac+5 et depuis, zéro retour après des dizaines de candidatures. Tu commences à douter de ton CV, de ton profil, de toi. Et si le problème venait aussi des offres que tu choisis ?</p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 text-lg px-8"
                >
                  <Link href="/inscription">
                    Commencer maintenant
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
            
                <img 
                  src="/image-bg-landing.svg" 
                  className="w-full lg:mt-[-130px] lg:block hidden "
                />
          </div>
        </div>
      </section>

      {/* What is Feeling Section */}
      <section className="lg:mt-[-100px] mt-20 pb-10 z-10 relative">
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

      {/* How it Works Section */}
      <section id="comment-ca-marche" className="py-12 scroll-mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-center font-bold mb-16">
            Comment ça marche ?
          </h2>
          
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

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Pourquoi utiliser Feeling ?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8  mx-auto">
            <div className="bg-background rounded-2xl py-8 px-6 border border-info text-center">
              <h3 className="text-xl  text-info font-bold mb-4">Gagne du temps</h3>
              <p className="text-muted-foreground text-sm">
                Arrête de passer des heures sur des offres qui ne valorisent pas vraiment ton profil : Feeling t’aide à cibler les opportunités qui te correspondent vraiment.
              </p>
            </div>
            
            <div className="bg-background rounded-2xl p-8 border border-info text-center">
              <h3 className="text-xl text-info font-bold mb-3">Retrouve confiance</h3>
              <p className="text-muted-foreground text-sm">
                Comprendre pourquoi une offre te correspond (ou non) aide à candidater avec plus de recul et moins au hasard.              </p>
            </div>
            
            <div className="bg-background rounded-2xl p-8 border border-info text-center">
              <h3 className="text-xl text-info font-bold mb-3">Comprends ce que les recruteurs attendent</h3>
              <p className="text-muted-foreground text-sm">
Feely décrypte ce qui compte vraiment derrière une offre : la culture, les attentes implicites et le type de profil recherché.              </p>
            </div>

            <div className="bg-background rounded-2xl p-8 border border-info text-center">
              <h3 className="text-xl text-info font-bold mb-3">Candidate plus sereinement</h3>
              <p className="text-muted-foreground text-sm">
CV et lettre de motivation s’adaptent à l’offre pour mettre en valeur ce qui compte vraiment dans ton profil.              </p>
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
