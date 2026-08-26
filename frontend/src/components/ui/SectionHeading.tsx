import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../../utils/cn'

type EyebrowTone = 'accent' | 'secondary' | 'tertiary' | 'muted'

const toneMap: Record<EyebrowTone, string> = {
  accent: 'text-cyber-accent',
  secondary: 'text-cyber-accent-secondary',
  tertiary: 'text-cyber-accent-tertiary',
  muted: 'text-cyber-muted-fg',
}

type SectionHeadingProps = {
  eyebrow?: string
  tone?: EyebrowTone
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Standard panel header: eyebrow + title on the left, optional action on the
 * right, vertically centered so every card header lines up the same way.
 */
export function SectionHeading({
  eyebrow,
  tone = 'accent',
  title,
  description,
  action,
  className = '',
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className={cn('cyber-label', toneMap[tone])}>{eyebrow}</p>
        ) : null}
        <h2 className="cyber-h3 mt-1">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-prose font-mono text-sm text-cyber-muted-fg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Consistent "go somewhere" link used in panel headers. */
export function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-cyber-accent transition hover:text-cyber-accent-secondary cyber-focus"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}
