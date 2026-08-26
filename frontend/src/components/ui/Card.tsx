import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { HolographicCorners, TerminalHeader } from './CyberShell'

type CardVariant = 'default' | 'terminal' | 'holographic'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  variant?: CardVariant
  hoverEffect?: boolean
  terminalTitle?: string
  padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  terminalTitle,
  padding = 'md',
  ...props
}: CardProps) {
  if (variant === 'terminal') {
    return (
      <div className={cn('cyber-terminal relative', className)} {...props}>
        <TerminalHeader title={terminalTitle} />
        <div className={paddingMap[padding]}>{children}</div>
      </div>
    )
  }

  if (variant === 'holographic') {
    return (
      <div
        className={cn(
          'cyber-card-holographic cyber-corner-accents relative',
          hoverEffect && 'cyber-card-hover',
          paddingMap[padding],
          className,
        )}
        {...props}
      >
        <HolographicCorners />
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'cyber-card',
        hoverEffect && 'cyber-card-hover',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
