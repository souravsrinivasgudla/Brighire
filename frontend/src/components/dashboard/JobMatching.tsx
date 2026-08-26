import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { DashboardMatch } from '../../types/api'
import { Badge } from '../ui/Badge'
import { SectionHeading, SectionLink } from '../ui/SectionHeading'

type JobMatchingProps = {
  matches: DashboardMatch[]
}

export function JobMatching({ matches }: JobMatchingProps) {
  return (
    <section className="cyber-card p-5 sm:p-6">
      <SectionHeading
        eyebrow="// job matching engine"
        tone="tertiary"
        title="AI Recommended Opportunities"
        action={<SectionLink to="/jobs">Browse all</SectionLink>}
      />

      {matches.length === 0 ? (
        <p className="mt-6 cyber-body-muted">
          Run a job match to populate opportunity capsules.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0, 6).map((match) => (
            <li
              key={match.id}
              className="flex h-full flex-col border border-cyber-border bg-cyber-muted p-4 transition hover:border-cyber-accent cyber-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate cyber-label">{match.company}</p>
                  <h3 className="cyber-h3 mt-1 text-sm">{match.job_title}</h3>
                </div>
                <Badge variant="accent" className="shrink-0">
                  {match.match_score}%
                </Badge>
              </div>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-cyber-muted-fg">
                {match.summary}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {['AWS', 'Kubernetes', 'Python'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 border border-cyber-border bg-cyber-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyber-muted-fg"
                  >
                    <Check className="h-3 w-3 text-cyber-accent" strokeWidth={1.5} />
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to={`/jobs/${match.job_id}`}
                className="mt-auto inline-flex items-center gap-1 pt-4 font-mono text-xs uppercase tracking-wider text-cyber-accent hover:text-cyber-accent-secondary cyber-focus"
              >
                Open role
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
