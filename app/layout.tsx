import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const fraunces = Fraunces({ 
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Feeling - Le bon job, c\'est celui avec lequel tu as un bon feeling',
  description: 'Feeling est ton allié dans ta recherche d\'emploi. Il t\'aide à trouver un job qui te ressemble vraiment. Pas juste un job qui coche les cases, un job qui colle avec ta personnalité et tes valeurs.',
  generator: 'v0.app',
  keywords: ['emploi', 'job', 'matching', 'personnalité', 'valeurs', 'carrière', 'recrutement'],
  authors: [{ name: 'Feeling' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Feeling - Trouve un job qui te ressemble',
    description: 'Analyse les offres d\'emploi selon ta personnalité et tes valeurs',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const viewport: Viewport = {
  themeColor: '#D4C4FB',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wazkrrk00v");`}
          </Script>
        )}
      </head>
      <body className={`${dmSans.variable} ${fraunces.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <GoogleAnalytics gaId="G-PT379Z73RB" />
      </body>
    </html>
  )
}
