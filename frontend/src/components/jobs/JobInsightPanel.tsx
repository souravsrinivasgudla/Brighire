import { Link } from 'react-router-dom'

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

  const skillOverlap = Math.max(55, Math.min(95, job.matchScore - 5))
  const improvement = Math.max(4, Math.min(12, 100 - job.matchScore))

  return (
    <aside className="cyber-card p-5">
      <p className="cyber-label text-cyber-accent-secondary">// ai match explanation</p>
      <h2 className="cyber-h3 mt-1">{job.title}</h2>
      <p className="font-mono text-sm text-cyber-muted-fg">{job.company}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Stat label="Skill overlap" value={`${skillOverlap}%`} />
        <Stat label="Experience" value="Strong" />
        <Stat label="Projects" value="Highly relevant" />
        <Stat label="Match" value={`${job.matchScore}%`} />
      </div>

      <div className="mt-5">
        <p className="cyber-label text-cyber-accent">Why You Match</p>
        <ul className="mt-2 space-y-1.5 font-mono text-sm text-cyber-fg">
          {job.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="cyber-label text-cyber-accent-tertiary">Missing</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {(job.missing.length ? job.missing : ['None critical']).map((m) => (
            <li
              key={m}
              className="border border-cyber-accent-tertiary/30 bg-cyber-accent-tertiary/10 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-cyber-accent-tertiary"
            >
              {m}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-3 font-mono text-sm leading-relaxed text-cyber-fg cyber-chamfer-sm">
        Estimated improvement: adding{' '}
        <span className="font-bold text-cyber-accent">{job.missing[0] ?? 'targeted skills'}</span>{' '}
        could increase match score by ~{improvement}%.
      </p>

      <Link to={`/jobs/${job.id}`} className="mt-5 inline-block">
        <Button variant="glitch" size="md">
          Run Full Match & Apply
        </Button>
      </Link>
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
