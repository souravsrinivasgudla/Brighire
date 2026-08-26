import { SectionHeading, SectionLink } from '../ui/SectionHeading'

const stages = [
  { id: 'applied', label: 'Applied' },
  { id: 'reviewing', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
] as const

type ApplicationTimelineProps = {
  counts: Record<string, number>
  total: number
}

export function ApplicationTimeline({
  counts,
  total,
}: ApplicationTimelineProps) {
  const activeIndex = stages.reduce((acc, stage, i) => {
    return (counts[stage.id] ?? 0) > 0 ? i : acc
  }, 0)

  return (
    <section className="cyber-card p-5 sm:p-6">
      <SectionHeading
        eyebrow="// application tracker"
        title="Pipeline Timeline"
        action={<SectionLink to="/applications">Manage</SectionLink>}
      />

      <ol className="mt-8 grid grid-cols-2 gap-y-6 sm:flex sm:items-start sm:justify-between sm:gap-y-0">
        {stages.map((stage, i) => {
          const count = counts[stage.id] ?? 0
          const completed = i < activeIndex || count > 0
          const active = i === activeIndex && total > 0

          return (
            <li key={stage.id} className="relative flex flex-1 flex-col items-center">
              {i < stages.length - 1 ? (
                <span
                  className={`absolute left-1/2 top-4 hidden h-px w-full sm:block ${
                    completed ? 'bg-cyber-accent/60' : 'bg-cyber-border'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center border font-mono text-xs font-bold cyber-chamfer-sm ${
                  active
                    ? 'border-cyber-accent bg-cyber-accent/20 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
                    : completed
                      ? 'border-cyber-accent/60 bg-cyber-accent/10 text-cyber-accent'
                      : 'border-cyber-border bg-cyber-muted text-cyber-muted-fg'
                }`}
              >
                {count}
              </span>
              <p className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-cyber-fg">
                {stage.label}
              </p>
            </li>
          )
        })}
      </ol>

      <p className="mt-6 text-center cyber-body-muted">
        {total === 0
          ? 'No applications yet — create one from a matched job.'
          : `${total} active application${total === 1 ? '' : 's'} in motion`}
      </p>
    </section>
  )
}
