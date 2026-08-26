import type { ApplicationCardData } from './ApplicationCard'
import { TimelineView } from './TimelineView'

type ApplicationDetailsProps = {
  app: ApplicationCardData | null
}

export function ApplicationDetails({ app }: ApplicationDetailsProps) {
  if (!app) {
    return (
      <aside className="cyber-card border-dashed p-5 cyber-body-muted">
        Select an application to open the intelligence workspace.
      </aside>
    )
  }

  return (
    <aside className="space-y-4 cyber-card p-5">
      <div>
        <p className="cyber-label">Application Detail</p>
        <h2 className="cyber-h3 mt-1">{app.title}</h2>
        <p className="cyber-body-muted">{app.company}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Meta label="Status" value={app.status} />
        <Meta label="Match" value={`${app.matchScore}%`} />
        <Meta label="Interview probability" value={`${app.interviewProbability}%`} />
        <Meta label="Resume" value={app.resumeName} />
      </div>

      <TimelineView status={app.status} />

      <div className="border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-3 text-sm leading-relaxed text-cyber-fg cyber-chamfer-sm">
        <p className="cyber-label text-cyber-accent">AI Recommendation</p>
        <p className="mt-1">
          You should emphasize cloud deployment experience during interviews and
          prep system design stories tied to this role.
        </p>
      </div>
    </aside>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-cyber-border bg-cyber-muted px-3 py-2 cyber-chamfer-sm">
      <p className="cyber-label text-[10px]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-cyber-fg">{value}</p>
    </div>
  )
}
