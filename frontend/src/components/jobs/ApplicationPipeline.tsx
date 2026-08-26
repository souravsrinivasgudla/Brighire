import { Link } from 'react-router-dom'

const STAGES = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
] as const

type ApplicationPipelineProps = {
  counts: Record<string, number>
}

export function ApplicationPipeline({ counts }: ApplicationPipelineProps) {
  return (
    <section className="cyber-card p-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="cyber-label text-cyber-accent">// career pipeline</p>
          <h2 className="cyber-h3 mt-1">Saved Opportunities</h2>
        </div>
        <Link
          to="/applications"
          className="font-mono text-xs uppercase tracking-wider text-cyber-accent transition hover:text-cyber-accent-secondary"
        >
          Tracker →
        </Link>
      </div>

      <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {STAGES.map((stage, i) => {
          const count =
            stage.id === 'saved'
              ? counts.saved ?? 0
              : stage.id === 'applied'
                ? (counts.applied ?? 0) + (counts.reviewing ?? 0)
                : counts[stage.id] ?? 0
          return (
            <li key={stage.id} className="relative flex flex-1 flex-col items-center">
              {i < STAGES.length - 1 ? (
                <span
                  className="absolute left-1/2 top-4 hidden h-px w-full bg-cyber-border sm:block"
                  aria-hidden="true"
                />
              ) : null}
              <span className="relative z-10 flex h-8 w-8 items-center justify-center border border-cyber-accent/40 bg-cyber-accent/10 font-mono text-xs font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]">
                {count}
              </span>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-cyber-fg">
                {stage.label}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
