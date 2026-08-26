import { Link } from 'react-router-dom'

import type { Resume } from '../../types/api'
import { formatDate } from '../../utils/format'

type VersionHistoryProps = {
  resumes: Resume[]
  activeId: string
  scores: Record<string, number | undefined>
}

export function VersionHistory({
  resumes,
  activeId,
  scores,
}: VersionHistoryProps) {
  const ordered = [...resumes].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return (
    <div className="cyber-card p-5">
      <p className="cyber-label">Resume Version History</p>
      <h3 className="cyber-h3 mt-1">Evolution timeline</h3>

      <ol className="relative mt-6 space-y-0 pl-2">
        <div
          className="absolute bottom-3 left-[19px] top-3 w-px bg-cyber-border"
          aria-hidden="true"
        />
        {ordered.map((resume, i) => {
          const score = scores[resume.id]
          const active = resume.id === activeId
          return (
            <li key={resume.id} className="relative flex gap-4 pb-6 last:pb-0">
              <span
                className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold cyber-chamfer-sm ${
                  active
                    ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
                    : 'border-cyber-border bg-cyber-muted text-cyber-muted-fg'
                }`}
              >
                v{i + 1}
              </span>
              <div className="min-w-0 flex-1 border border-cyber-border bg-cyber-muted px-3 py-3 cyber-chamfer-sm">
                <p className="truncate text-sm font-semibold text-cyber-fg">
                  {resume.filename}
                </p>
                <p className="cyber-body-muted mt-1 text-xs">
                  {formatDate(resume.created_at)}
                  {score != null ? ` · ATS ${score}` : ''}
                </p>
                <Link
                  to={`/resumes/${resume.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-cyber-accent hover:text-cyber-accent/80"
                >
                  Open version →
                </Link>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
