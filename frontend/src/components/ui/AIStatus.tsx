import { cn } from '../../utils/cn'

export type AIStatusState = 'online' | 'analyzing' | 'processing' | 'complete' | 'warning' | 'offline'

type AIStatusProps = {
  state: AIStatusState
  label?: string
  className?: string
}

const stateConfig: Record<AIStatusState, { color: string; label: string }> = {
  online: { color: 'bg-cyber-accent shadow-[var(--box-shadow-neon-sm)]', label: 'AI ONLINE' },
  analyzing: { color: 'bg-cyber-accent-tertiary', label: 'ANALYZING' },
  processing: { color: 'bg-cyber-accent-tertiary animate-pulse', label: 'PROCESSING' },
  complete: { color: 'bg-cyber-accent', label: 'COMPLETE' },
  warning: { color: 'bg-[#f59e0b]', label: 'ATTENTION' },
  offline: { color: 'bg-cyber-muted-fg', label: 'OFFLINE' },
}

export function AIStatus({ state, label, className = '' }: AIStatusProps) {
  const config = stateConfig[state]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border border-cyber-border bg-cyber-muted px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.2em] text-cyber-fg',
        className,
      )}
      role="status"
    >
      <span className={cn('h-2 w-2', config.color)} aria-hidden="true" />
      {label ?? config.label}
    </span>
  )
}

export function AIScanningLoader({ label = 'SCANNING DATA STREAM…' }: { label?: string }) {
  return (
    <div
      className="relative overflow-hidden border border-cyber-border bg-cyber-card p-8 cyber-chamfer"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 border border-cyber-accent/30 cyber-chamfer-sm" />
          <div
            className="absolute inset-2 border border-transparent border-t-cyber-accent animate-spin"
            style={{ animationDuration: '0.9s' }}
          />
        </div>
        <p className="font-mono text-sm text-cyber-muted-fg cyber-cursor">{label}</p>
      </div>
    </div>
  )
}

export function SkeletonGlass({ className = '' }: { className?: string }) {
  return (
    <div
      className={cn(
        'border border-cyber-border bg-cyber-muted/50 cyber-chamfer animate-pulse',
        className,
      )}
      aria-hidden="true"
    />
  )
}
