import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

type BadgeVariant =
  | 'default'
  | 'accent'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error'

export type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'border-cyber-border bg-cyber-muted text-cyber-fg',
  accent: 'border-cyber-accent/40 bg-cyber-accent/10 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]',
  secondary: 'border-cyber-accent-secondary/40 bg-cyber-accent-secondary/10 text-cyber-accent-secondary',
  tertiary: 'border-cyber-accent-tertiary/40 bg-cyber-accent-tertiary/10 text-cyber-accent-tertiary',
  success: 'border-cyber-accent/40 bg-cyber-accent/10 text-cyber-accent',
  warning: 'border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]',
  error: 'border-cyber-destructive/40 bg-cyber-destructive/10 text-cyber-destructive',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-3 py-1 font-label text-xs uppercase tracking-[0.15em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function MatchBadge({ score }: { score: number }) {
  const variant: BadgeVariant =
    score >= 85 ? 'accent' : score >= 70 ? 'tertiary' : score >= 50 ? 'warning' : 'default'
  return <Badge variant={variant}>{score}% MATCH</Badge>
}

export function AIBadge({ label = 'AI RECOMMENDED' }: { label?: string }) {
  return (
    <Badge variant="secondary">
      <span className="h-1.5 w-1.5 bg-cyber-accent-secondary shadow-[var(--box-shadow-neon-secondary)]" />
      {label}
    </Badge>
  )
}
