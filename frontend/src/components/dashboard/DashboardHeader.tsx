import { Bell, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { AIStatus } from '../ui/AIStatus'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'MORNING'
  if (hour < 18) return 'AFTERNOON'
  return 'EVENING'
}

export function DashboardHeader() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? 'OPERATOR'
  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="flex flex-col gap-4 cyber-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="cyber-label">// session active</p>
        <h1 className="cyber-h3 mt-1 text-lg sm:text-xl">
          {greeting()}, {firstName.toUpperCase()}
        </h1>
        <p className="mt-1 font-mono text-xs text-cyber-muted-fg">
          &gt; Career analysis ready for review_
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AIStatus state="online" className="hidden sm:inline-flex" />

        <Link
          to="/ai-coach"
          className="inline-flex h-11 w-11 items-center justify-center border border-cyber-border bg-cyber-muted text-cyber-muted-fg transition hover:border-cyber-accent hover:text-cyber-accent cyber-chamfer-sm cyber-focus"
          aria-label="Open BrightHire AI"
        >
          <MessageSquare className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-cyber-border bg-cyber-muted text-cyber-muted-fg transition hover:border-cyber-accent hover:text-cyber-accent cyber-chamfer-sm cyber-focus"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
        </button>

        <Link
          to="/profile"
          className="flex h-11 w-11 items-center justify-center border-2 border-cyber-accent bg-cyber-muted font-mono text-xs font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)] cyber-focus"
          aria-label="Open profile"
        >
          {initials || 'U'}
        </Link>
      </div>
    </header>
  )
}
