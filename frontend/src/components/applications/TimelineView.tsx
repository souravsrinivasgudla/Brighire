import type { ApplicationStatus } from '../../types/api'

const FLOW: { id: ApplicationStatus | 'start'; label: string }[] = [
  { id: 'start', label: 'Submitted' },
  { id: 'applied', label: 'Applied' },
  { id: 'reviewing', label: 'Recruiter Review' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
]

const ORDER: Record<string, number> = {
  start: 0,
  applied: 1,
  reviewing: 2,
  interview: 3,
  offer: 4,
  rejected: 2,
  withdrawn: 1,
}

type TimelineViewProps = {
  status: ApplicationStatus
}

export function TimelineView({ status }: TimelineViewProps) {
  const current = ORDER[status] ?? 1

  return (
    <div>
      <p className="cyber-label">Application timeline</p>
      <ol className="mt-3 space-y-3">
        {FLOW.map((step, i) => {
          const done = i <= current
          const active = i === current
          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center border text-[10px] font-bold cyber-chamfer-sm ${
                  active
                    ? 'border-cyber-accent bg-cyber-accent/20 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
                    : done
                      ? 'border-cyber-accent/50 bg-cyber-accent/10 text-cyber-accent'
                      : 'border-cyber-border bg-cyber-muted text-cyber-muted-fg'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-sm ${done ? 'text-cyber-fg' : 'text-cyber-muted-fg'}`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
