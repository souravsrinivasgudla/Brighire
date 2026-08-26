import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { AIStatus, type AIStatusState } from './AIStatus'
import { chartTheme } from './chartTheme'
import { GlassPanel, GlassPanelHeader } from './GlassPanel'

type ChartContainerProps = {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  aiStatus?: AIStatusState
  className?: string
  height?: number
}

export function ChartContainer({
  title,
  subtitle,
  children,
  action,
  aiStatus,
  className = '',
  height = 280,
}: ChartContainerProps) {
  return (
    <GlassPanel variant="holographic" padding="md" className={className}>
      <GlassPanelHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            {aiStatus ? <AIStatus state={aiStatus} /> : null}
            {action}
          </div>
        }
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4',
        )}
        style={{ minHeight: height }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.15), transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative h-full w-full">{children}</div>
      </div>
    </GlassPanel>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl border border-white/10 px-3 py-2 shadow-xl backdrop-blur-xl"
      style={{ background: chartTheme.tooltip.bg }}
    >
      {label ? <p className="mb-1 text-xs text-slate-500">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium text-slate-200">
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color ?? chartTheme.colors[0] }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}