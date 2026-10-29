import { Radar } from 'lucide-react'
import { useState } from 'react'

import { discoverJobs } from '../../api/jobs'
import type { JobDiscoveryResponse } from '../../types/api'
import { getErrorMessage } from '../../utils/errors'
import { Button } from '../ui/Button'

type ProfileJobDiscoveryProps = {
  resumeId: string | null
  onDiscovered: (result: JobDiscoveryResponse) => void
}

const inputClass =
  'w-full border border-cyber-border bg-cyber-bg px-3 py-2.5 font-mono text-sm text-cyber-fg placeholder:text-cyber-muted-fg outline-none transition focus:border-cyber-accent cyber-chamfer-sm'

export function ProfileJobDiscovery({
  resumeId,
  onDiscovered,
}: ProfileJobDiscoveryProps) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobDiscoveryResponse | null>(null)

  async function run() {
    if (!resumeId) return
    setRunning(true)
    setError(null)
    try {
      const data = await discoverJobs({
        resume_id: resumeId,
        query: query.trim() || undefined,
        location: location.trim() || undefined,
      })
      setResult(data)
      onDiscovered(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRunning(false)
    }
  }

  const scored = result?.imported.filter((item) => item.match_score != null).length ?? 0

  return (
    <section className="cyber-card p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cyber-label text-cyber-accent">// live job portals</p>
          <h2 className="cyber-h3 mt-1">Find jobs for my profile</h2>
          <p className="mt-1 cyber-body-muted">
            Searches connected portals using your primary resume, imports new
            listings, and scores the top 10 against your profile.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="sr-only" htmlFor="discover-query">
          Role override
        </label>
        <input
          id="discover-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Role (optional — inferred from resume)"
          className={inputClass}
        />
        <label className="sr-only" htmlFor="discover-location">
          Location override
        </label>
        <input
          id="discover-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className={inputClass}
        />
        <Button
          type="button"
          variant="glitch"
          loading={running}
          disabled={!resumeId}
          onClick={() => void run()}
          leftIcon={<Radar className="h-4 w-4" strokeWidth={1.5} />}
        >
          {running ? 'Searching portals…' : 'Discover'}
        </Button>
      </div>

      {!resumeId ? (
        <p className="mt-3 cyber-body-muted">Upload a resume to enable discovery.</p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 font-mono text-sm text-cyber-destructive">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-1 border-t border-cyber-border pt-3 font-mono text-xs text-cyber-muted-fg">
          <p>
            Searched: <span className="text-cyber-fg">{result.queries.join(' · ')}</span>
            {result.location ? ` in ${result.location}` : ''}
          </p>
          <p>
            Imported <span className="text-cyber-accent">{result.imported.length}</span> new
            {' '}· scored {scored} · skipped {result.skipped_duplicates} already saved
          </p>
          {result.source_errors.length ? (
            <p className="text-cyber-accent-tertiary">
              Some sources failed: {result.source_errors.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
