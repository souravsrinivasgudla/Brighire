import { useEffect, useMemo, useState } from 'react'

import { listApplications } from '../api/applications'
import { ApplicationTimeline } from '../components/dashboard/ApplicationTimeline'
import { PageHeader } from '../components/PageHeader'
import { ErrorBanner, LoadingState } from '../components/ui'
import type { Application } from '../types/api'
import { getErrorMessage } from '../utils/errors'

export function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const apps = await listApplications()
        if (!cancelled) setApplications(apps)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1
    }
    return counts
  }, [applications])

  return (
    <div className="space-y-6 text-cyber-fg">
      <PageHeader
        eyebrow="// application tracker"
        title="Pipeline Timeline"
        description="Stage-by-stage view of every application currently in motion."
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState label="Reading pipeline state…" />
      ) : (
        <ApplicationTimeline counts={statusCounts} total={applications.length} />
      )}
    </div>
  )
}
