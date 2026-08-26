import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

import { cn } from '../../utils/cn'
import { Button } from './Button'
import { Card } from './Card'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <Card variant="holographic" padding="lg" className={cn('text-center', className)}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent cyber-chamfer-sm">
        {icon ?? <Sparkles className="h-7 w-7 cyber-icon" strokeWidth={1.5} />}
      </div>
      <h2 className="cyber-h3">{title}</h2>
      <p className="mx-auto mt-2 max-w-md font-mono text-sm text-cyber-muted-fg">{description}</p>
      {action ? (
        <div className="mt-6 flex justify-center">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-6 flex justify-center">
          <Button variant="glitch" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

export function LoadingState({ label = 'SCANNING DATA STREAM…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 font-mono text-sm text-cyber-muted-fg"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-10 w-10" aria-hidden="true">
        <div className="absolute inset-0 border border-cyber-accent/30 cyber-chamfer-sm" />
        <div
          className="absolute inset-1 border border-transparent border-t-cyber-accent animate-spin cyber-chamfer-sm"
          style={{ animationDuration: '0.8s' }}
        />
      </div>
      <span className="cyber-cursor">{label}</span>
    </div>
  )
}

export function ErrorBanner({ message, friendly = true }: { message: string; friendly?: boolean }) {
  const displayMessage = friendly
    ? message.startsWith('>')
      ? message
      : `> SIGNAL LOST: ${message}`
    : message

  return (
    <div
      role="alert"
      className="border border-cyber-destructive/40 bg-cyber-destructive/10 px-4 py-3 font-mono text-sm text-cyber-destructive cyber-chamfer-sm"
    >
      {displayMessage}
    </div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="border border-cyber-accent/40 bg-cyber-accent/10 px-4 py-3 font-mono text-sm text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]"
    >
      {message.startsWith('>') ? message : `> ${message}`}
    </div>
  )
}

export function InfoBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="border border-cyber-accent-tertiary/40 bg-cyber-accent-tertiary/10 px-4 py-3 font-mono text-sm text-cyber-accent-tertiary cyber-chamfer-sm"
    >
      {message}
    </div>
  )
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('cyber-container', className)}>{children}</div>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="cyber-h3">{children}</h2>
}

export function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="font-mono text-sm text-cyber-muted-fg">&gt; NONE DETECTED</p>
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-1 font-label text-xs uppercase tracking-wider text-cyber-accent"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'border-cyber-accent/40 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
      : score >= 60
        ? 'border-cyber-accent-tertiary/40 text-cyber-accent-tertiary'
        : score >= 40
          ? 'border-[#f59e0b]/40 text-[#f59e0b]'
          : 'border-cyber-destructive/40 text-cyber-destructive'

  return (
    <span
      className={`inline-flex min-w-14 items-center justify-center border bg-cyber-muted px-3 py-1 font-mono text-sm font-bold ${tone}`}
    >
      {score}
    </span>
  )
}

export function StatusPill({
  active,
  activeLabel = 'ONLINE',
  inactiveLabel = 'OFFLINE',
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1 font-label text-xs uppercase tracking-wider ${
        active
          ? 'border-cyber-accent/40 bg-cyber-accent/10 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
          : 'border-cyber-destructive/40 bg-cyber-destructive/10 text-cyber-destructive'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 ${active ? 'bg-cyber-accent animate-pulse' : 'bg-cyber-destructive'}`}
        aria-hidden="true"
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="cyber-label">{label}</dt>
      <dd className="break-words font-mono text-sm text-cyber-fg sm:text-base">{value}</dd>
    </div>
  )
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card padding="md" className={className}>
      {children}
    </Card>
  )
}
