import { cn } from '@/lib/utils'
import Link from 'next/link'

interface FeelingLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  asLink?: boolean
}

const sizeMap = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
}

export function FeelingLogo({ size = 'md', className, asLink = true }: FeelingLogoProps) {
  const content = (
    <span 
      className={cn(
        'font-feeling-logo tracking-tight select-none',
        sizeMap[size],
        className
      )}
      style={{ fontFamily: 'var(--font-fraunces), serif', fontStyle: 'italic' }}
    >
      feeling
    </span>
  )
  
  if (asLink) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }
  
  return content
}
