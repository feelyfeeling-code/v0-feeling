import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
      <body className={`${dmSans.variable} ${fraunces.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
