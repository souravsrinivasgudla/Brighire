import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { HolographicCorners, TerminalHeader } from './CyberShell'

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  variant?: 'default' | 'terminal' | 'holographic'
  padding?: 'sm' | 'md' | 'lg'
  terminalTitle?: string
  hoverEffect?: boolean
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function GlassPanel({
  children,
  className = '',
  variant = 'holographic',
  padding = 'md',
  terminalTitle,
  hoverEffect = false,
  ...props
}: GlassPanelProps) {
  if (variant === 'terminal') {
    return (
      <div className={cn('cyber-terminal relative', className)} {...props}>
        <TerminalHeader title={terminalTitle ?? 'brighire.sys'} />
        <div className={paddingMap[padding]}>{children}</div>
      </div>
    )
  }

  if (variant === 'default') {
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

export function GlassPanelHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 border-b border-cyber-border pb-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent cyber-chamfer-sm">
            {icon}
          </div>
        ) : null}
        <div>
          <h3 className="cyber-h3 text-base">{title}</h3>
          {subtitle ? (
            <p className="mt-1 font-mono text-xs text-cyber-muted-fg">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  )
}
