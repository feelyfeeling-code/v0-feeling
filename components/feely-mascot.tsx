'use client'

import { cn } from '@/lib/utils'

interface FeelyMascotProps {
  /**
   * Kept for backwards compatibility with existing call sites.
   * The mascot is now a fixed raster image, so this prop has no visual effect.
   */
  variant?: 'default' | 'purple' | 'blue' | 'happy' | 'thinking'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  speechBubble?: string
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
}

export function FeelyMascot({
  size = 'md',
  className,
  speechBubble,
}: FeelyMascotProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {speechBubble && (
        <div className="absolute -top-8 -right-4 bg-white border border-border rounded-xl px-3 py-1 text-sm font-medium shadow-sm whitespace-nowrap">
          {speechBubble}
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-border rotate-45" />
        </div>
      )}
      <img
        src="/feely-mascot.svg"
        alt="Feely, la mascotte de Feeling"
        className={cn(sizeMap[size], 'object-contain')}
      />
    </div>
  )
}
