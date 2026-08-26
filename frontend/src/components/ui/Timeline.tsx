import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { Badge } from './Badge'

export type TimelineItem = {
  id: string
  title: string
  description?: string
  timestamp?: string
  status?: 'complete' | 'active' | 'pending' | 'warning'
  icon?: ReactNode
  badge?: string
}

type TimelineProps = {
  items: TimelineItem[]
  className?: string
}

const statusStyles = {
  complete: 'border-cyber-accent/50 bg-cyber-accent/10 text-cyber-accent',
  active: 'border-cyber-accent-tertiary/50 bg-cyber-accent-tertiary/10 text-cyber-accent-tertiary shadow-[var(--box-shadow-neon-tertiary)]',
  pending: 'border-cyber-border bg-cyber-muted text-cyber-muted-fg',
  warning: 'border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#f59e0b]',
}

const lineStyles = {
  complete: 'bg-cyber-accent/30',
  active: 'bg-cyber-accent-tertiary/40',
  pending: 'bg-cyber-border',
  warning: 'bg-[#f59e0b]/30',
}

export function Timeline({ items, className = '' }: TimelineProps) {
  if (items.length === 0) {
    return <p className="font-mono text-sm text-cyber-muted-fg">&gt; NO EVENTS LOGGED</p>
  }

  return (
    <ol className={cn('space-y-0', className)} aria-label="Timeline">
      {items.map((item, index) => {
        const status = item.status ?? 'pending'
        const isLast = index === items.length - 1

        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-16px)] w-px',
                  lineStyles[status],
                )}
                aria-hidden="true"
              />
            ) : null}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border cyber-chamfer-sm',
                statusStyles[status],
              )}
              aria-hidden="true"
            >
              {item.icon ?? <span className="h-2 w-2 bg-current" />}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-mono text-sm font-semibold uppercase tracking-wide text-cyber-fg">
                  {item.title}
                </h4>
                {item.badge ? <Badge variant="accent">{item.badge}</Badge> : null}
              </div>
              {item.description ? (
                <p className="mt-1 font-mono text-sm text-cyber-muted-fg">{item.description}</p>
              ) : null}
              {item.timestamp ? (
                <time className="mt-1 block font-label text-[10px] uppercase tracking-widest text-cyber-muted-fg">
                  {item.timestamp}
                </time>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
