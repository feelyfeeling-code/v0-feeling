'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FeelingLogo } from '@/components/feeling-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, MessageSquareHeart, LogOut } from 'lucide-react'

const LINKS = [
  { href: '/school/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/school/graduates', label: 'Diplômés', icon: Users },
  { href: '/school/coaching', label: 'Coaching', icon: MessageSquareHeart },
]

export function SchoolNav({ schoolName, advisorName }: { schoolName: string; advisorName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FeelingLogo size="md" />
            <span className="hidden sm:inline text-sm font-medium text-muted-foreground border-l border-border pl-3">
              Espace École
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold">{schoolName}</span>
              <span className="text-xs text-muted-foreground">{advisorName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 -mb-px">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
