import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { MatchBadge } from '../ui/Badge'

export type JobOpportunity = {
  id: string
  title: string
  company: string
  location: string | null
  matchScore: number
  reasons: string[]
  missing: string[]
  summary: string
}

type JobRecommendationCardProps = {
  job: JobOpportunity
  selected: boolean
  onSelect: () => void
  onRemove?: () => void
}

export function JobRecommendationCard({
  job,
  selected,
  onSelect,
  onRemove,
}: JobRecommendationCardProps) {
  return (
    <article
      className={`group cursor-pointer border bg-cyber-muted p-5 transition cyber-chamfer-sm cyber-focus ${
        selected
          ? 'border-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
          : 'border-cyber-border hover:border-cyber-accent/60'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="cyber-h3 text-base">{job.title}</h3>
          <p className="mt-1 font-mono text-sm text-cyber-muted-fg">
            {job.company}
            {job.location ? ` · ${job.location}` : ''}
          </p>
        </div>
        <MatchBadge score={job.matchScore} />
      </div>

      <p className="mt-3 cyber-label">Why AI Recommends</p>
      <ul className="mt-2 space-y-1">
        {job.reasons.slice(0, 3).map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-1.5 font-mono text-sm text-cyber-fg"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyber-accent" strokeWidth={1.5} />
            {reason}
          </li>
        ))}
      </ul>

      {job.missing.length > 0 ? (
        <div className="mt-3">
          <p className="cyber-label text-cyber-accent-tertiary">Missing</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {job.missing.slice(0, 3).map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1 border border-cyber-accent-tertiary/30 bg-cyber-accent-tertiary/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-cyber-accent-tertiary"
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selected ? (
        <p className="mt-3 line-clamp-3 font-mono text-xs leading-relaxed text-cyber-muted-fg">
          {job.summary}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cyber-border pt-3">
        <Link
          to={`/jobs/${job.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-cyber-accent hover:text-cyber-accent-secondary cyber-focus"
        >
          Open intelligence
          <span aria-hidden="true">→</span>
        </Link>
        {onRemove ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="font-mono text-xs uppercase tracking-wider text-cyber-muted-fg transition hover:text-cyber-destructive cyber-focus"
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  )
}
