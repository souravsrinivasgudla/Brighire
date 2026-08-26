import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  name: string
  src?: string | null
  size?: AvatarSize
  showStatus?: boolean
  status?: 'online' | 'away' | 'offline'
  className?: string
}

const sizeMap: Record<AvatarSize, string> = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl sm:h-28 sm:w-28',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({
  name,
  src,
  size = 'md',
  showStatus = false,
  status = 'online',
  className = '',
}: AvatarProps) {
  const initials = getInitials(name)
  const statusColor = {
    online: 'bg-cyber-accent shadow-[var(--box-shadow-neon-sm)]',
    away: 'bg-[#f59e0b]',
    offline: 'bg-cyber-muted-fg',
  }

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('object-cover border border-cyber-accent/30 cyber-chamfer-sm', sizeMap[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center border-2 border-cyber-accent bg-cyber-muted font-display font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]',
            sizeMap[size],
          )}
          aria-hidden={!src}
        >
          {initials || 'U'}
        </div>
      )}
      {showStatus ? (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border border-cyber-bg',
            statusColor[status],
            size === 'xl' && 'h-3.5 w-3.5',
          )}
          aria-label={`Status: ${status}`}
        />
      ) : null}
    </div>
  )
}

export function IconContainer({
  children,
  className = '',
  size = 'md',
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent cyber-chamfer-sm',
        sizes[size],
        className,
      )}
    >
      {children}
    </div>
  )
}
