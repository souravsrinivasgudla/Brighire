import { Link } from 'react-router-dom'

import { formatJobSource } from '../../utils/format'
import { MatchBadge } from '../ui/Badge'

export type JobOpportunity = {
  id: string
  title: string
  company: string
  location: string | null
  matchScore: number | null
  summary: string
  source: string | null
  url: string | null
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
          {job.source ? (
            <p className="mt-1 font-label text-[10px] uppercase tracking-wider text-cyber-accent-secondary">
              via {formatJobSource(job.source)}
            </p>
          ) : null}
        </div>
        {job.matchScore != null ? <MatchBadge score={job.matchScore} /> : null}
      </div>

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
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-xs uppercase tracking-wider text-cyber-accent-secondary hover:text-cyber-accent cyber-focus"
          >
            View posting ↗
          </a>
        ) : null}
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
