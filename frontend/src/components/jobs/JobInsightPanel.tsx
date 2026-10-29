import { Link } from 'react-router-dom'

import { formatJobSource } from '../../utils/format'
import { Button } from '../ui/Button'
import type { JobOpportunity } from './JobRecommendationCard'

type JobInsightPanelProps = {
  job: JobOpportunity | null
}

export function JobInsightPanel({ job }: JobInsightPanelProps) {
  if (!job) {
    return (
      <aside className="border border-dashed border-cyber-border bg-cyber-muted/50 p-5 font-mono text-sm text-cyber-muted-fg cyber-card">
        Select an opportunity to open the AI reasoning panel.
      </aside>
    )
  }

  return (
    <aside className="cyber-card p-5">
      <p className="cyber-label text-cyber-accent-secondary">// ai match explanation</p>
      <h2 className="cyber-h3 mt-1">{job.title}</h2>
      <p className="font-mono text-sm text-cyber-muted-fg">{job.company}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Match"
          value={job.matchScore != null ? `${job.matchScore}%` : 'Not run yet'}
        />
        <Stat label="Location" value={job.location ?? '—'} />
      </div>

      <p className="mt-5 line-clamp-6 font-mono text-sm leading-relaxed text-cyber-fg">
        {job.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={`/jobs/${job.id}`}>
          <Button variant="glitch" size="md">
            Run Full Match & Apply
          </Button>
        </Link>
        {job.url ? (
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="md">
              Open on {job.source ? formatJobSource(job.source) : 'portal'} ↗
            </Button>
          </a>
        ) : null}
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-cyber-border bg-cyber-muted px-3 py-2.5 cyber-chamfer-sm">
      <p className="cyber-label">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-cyber-accent">{value}</p>
    </div>
  )
}
