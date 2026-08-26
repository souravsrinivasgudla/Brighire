import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

import type { ApplicationStatus } from '../../types/api'
import { formatDate } from '../../utils/format'
import { Button } from '../ui/Button'

export type ApplicationCardData = {
  id: string
  title: string
  company: string
  status: ApplicationStatus
  matchScore: number
  interviewProbability: number
  insight: string
  nextAction: string
  createdAt: string
  jobId: string
  resumeId: string
  resumeName: string
  coverLetter: string | null
}

type ApplicationCardProps = {
  app: ApplicationCardData
  selected: boolean
  onSelect: () => void
  onStatusChange: (status: ApplicationStatus) => void
  onDelete: () => void
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'applied',
  'reviewing',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
]

export function ApplicationCard({
  app,
  selected,
  onSelect,
  onStatusChange,
  onDelete,
}: ApplicationCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`cyber-card p-5 transition ${
        selected
          ? 'border-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
          : 'hover:border-cyber-accent/50'
      }`}
    >
      <button
        type="button"
        className="w-full text-left cyber-focus"
        onClick={onSelect}
        aria-pressed={selected}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex h-10 w-10 items-center justify-center border border-cyber-accent bg-cyber-accent/10 text-xs font-bold text-cyber-accent cyber-chamfer-sm">
              {app.company.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="cyber-h3 mt-3 text-base">{app.title}</h3>
            <p className="cyber-body-muted">{app.company}</p>
          </div>
          <div className="text-right">
            <span className="border border-cyber-accent/40 bg-cyber-accent/10 px-2.5 py-1 font-mono text-xs font-bold text-cyber-accent cyber-chamfer-sm">
              {app.matchScore}% match
            </span>
            <p className="mt-2 font-mono text-[10px] text-cyber-muted-fg">
              Interview prob. {app.interviewProbability}%
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-cyber-fg">
          <span className="font-semibold text-cyber-accent-secondary">AI Insight:</span>{' '}
          {app.insight}
        </p>
        <p className="mt-2 text-sm text-cyber-accent">
          <span className="font-semibold">Next Action:</span> {app.nextAction}
        </p>
      </button>

      {selected ? (
        <div className="mt-4 space-y-3 border-t border-cyber-border pt-4">
          <p className="cyber-body-muted text-xs">
            Created {formatDate(app.createdAt)} · Resume {app.resumeName}
          </p>
          {app.coverLetter ? (
            <p className="line-clamp-3 cyber-body-muted text-xs">
              {app.coverLetter}
            </p>
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            <label className="block cyber-label text-xs">
              Status
              <select
                value={app.status}
                onChange={(e) =>
                  onStatusChange(e.target.value as ApplicationStatus)
                }
                className="mt-1 block border border-cyber-border bg-cyber-muted px-3 py-2 text-sm text-cyber-fg outline-none focus:border-cyber-accent cyber-chamfer-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <Link to={`/jobs/${app.jobId}`}>
              <Button variant="outline" size="sm">
                View job
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      ) : null}
    </motion.article>
  )
}
