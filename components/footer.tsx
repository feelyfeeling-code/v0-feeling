import { FeelingLogo } from './feeling-logo'
import Link from 'next/link'
import { Instagram, Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Logo and Tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <FeelingLogo size="lg" className="text-background" asLink={false} />
              <div className="w-px h-12 bg-background/30" />
              <p className="text-lg font-medium leading-tight">
                Le décodeur d&apos;offres d&apos;emploi<br />
                pour les <span className="text-primary">Bac+5</span> qui démarrent.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="mt-4">
              <p className="text-sm text-background/70 mb-3">Suivez-nous sur les réseaux sociaux</p>
              <div className="flex items-center gap-4">
                <Link 
                  href="https://www.instagram.com/feely.feeling/"
                  target="_blank"
                  className="hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </Link>
                <Link 
                  href="https://www.linkedin.com/company/feely-feeling"
                  target="_blank"
                  className="hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </Link>
                <Link 
                  href="https://www.tiktok.com/@feely.feeling"
                  target="_blank"
                  className="hover:text-primary transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Contact */}
            <div className="mt-4">
              <p className="text-sm text-background/70 mb-1">Une question ou autre ? Contacte-nous !</p>
              <a 
                href="mailto:feely.feeling@gmail.com"
                className="text-sm hover:text-primary transition-colors"
              >
                feely.feeling@gmail.com
              </a>
            </div>
          </div>
          
          {/* Legal Links */}
          <div className="flex flex-col gap-2">
            <p className="font-medium mb-2">Informations légales</p>
            <Link href="/mentions-legales" className="text-sm text-background/70 hover:text-background transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-sm text-background/70 hover:text-background transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/donnees-personnelles" className="text-sm text-background/70 hover:text-background transition-colors">
              Collecte et traitement des données personnelles
            </Link>
            <Link href="/cgu" className="text-sm text-background/70 hover:text-background transition-colors">
              CGU
            </Link>
            <Link href="/cookies" className="text-sm text-background/70 hover:text-background transition-colors">
              Gestion des cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
