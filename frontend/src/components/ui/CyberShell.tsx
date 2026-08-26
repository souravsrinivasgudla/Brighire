import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

type CyberShellProps = {
  children: ReactNode
  className?: string
  grid?: boolean
  mesh?: boolean
  scanlines?: boolean
  scanlineBeam?: boolean
}

export function CyberShell({
  children,
  className = '',
  grid = true,
  mesh = true,
  scanlines = true,
  scanlineBeam = true,
}: CyberShellProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-x-hidden bg-cyber-bg text-cyber-fg',
        scanlines && 'cyber-scanlines',
        scanlineBeam && 'cyber-scanline-beam',
        className,
      )}
    >
      {mesh ? (
        <div className="pointer-events-none absolute inset-0 cyber-mesh" aria-hidden="true" />
      ) : null}
      {grid ? (
        <div
          className="pointer-events-none absolute inset-0 cyber-grid-bg opacity-80"
          aria-hidden="true"
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function TerminalDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="cyber-terminal-dot bg-[#ff3366]" />
      <span className="cyber-terminal-dot bg-[#f59e0b]" />
      <span className="cyber-terminal-dot bg-[#00ff88]" />
    </div>
  )
}

export function TerminalHeader({ title }: { title?: string }) {
  return (
    <div className="cyber-terminal-header">
      <TerminalDots />
      {title ? (
        <span className="ml-2 font-label text-[10px] uppercase tracking-[0.2em] text-cyber-muted-fg">
          {title}
        </span>
      ) : null}
    </div>
  )
}

export function HolographicCorners({ className = '' }: { className?: string }) {
  return (
    <>
      <span
        className={cn(
          'pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-cyber-accent/50',
          className,
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-cyber-accent/50',
          className,
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-cyber-accent/50',
          className,
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-cyber-accent/50',
          className,
        )}
        aria-hidden="true"
      />
    </>
  )
}
