import { useEffect, useMemo, useState } from 'react'

import { listApplications } from '../api/applications'
import { deleteJob, listJobs } from '../api/jobs'
import { getResumeMatches, listResumes } from '../api/resumes'
import { AIMatchingHeader } from '../components/jobs/AIMatchingHeader'
import { ApplicationPipeline } from '../components/jobs/ApplicationPipeline'
import {
  JobRecommendationCard,
  type JobOpportunity,
} from '../components/jobs/JobRecommendationCard'
import { JobInsightPanel } from '../components/jobs/JobInsightPanel'
import { JobSearchAI } from '../components/jobs/JobSearchAI'
import { ProfileJobDiscovery } from '../components/jobs/ProfileJobDiscovery'
import { ErrorBanner, LoadingState } from '../components/ui'
import type {
  Application,
  Job,
  Resume,
  ResumeJobMatch,
} from '../types/api'
import { getErrorMessage } from '../utils/errors'

function toOpportunity(
  job: Job,
  match?: ResumeJobMatch,
): JobOpportunity {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchScore: match ? Math.round(match.match_score) : null,
    summary: match?.summary || job.description,
    source: job.source,
    url: job.url,
  }
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [matches, setMatches] = useState<ResumeJobMatch[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh(search = query) {
    setLoading(true)
    setError(null)
    try {
      const [jobData, apps, resumeData] = await Promise.all([
        listJobs({
          search: search.trim() || undefined,
          page_size: 100,
          sort_by: 'created_at',
        }),
        listApplications(),
        listResumes(),
      ])
      const primary = resumeData.find((r) => r.is_primary) ?? resumeData[0]
      setMatches(primary ? await getResumeMatches(primary.id) : [])
      setJobs(jobData.items)
      setTotal(jobData.total)
      setApplications(apps)
      setResumes(resumeData)
      setSelectedId((current) => current ?? jobData.items[0]?.id ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const matchByJobId = useMemo(() => {
    return new Map(matches.map((m) => [m.job_id, m]))
  }, [matches])

  const primaryResumeId =
    (resumes.find((r) => r.is_primary) ?? resumes[0])?.id ?? null

  const opportunities = useMemo(() => {
    let list = jobs.map((job) => toOpportunity(job, matchByJobId.get(job.id)))

    if (filters.includes('Remote')) {
      list = list.filter((j) =>
        (j.location ?? '').toLowerCase().includes('remote'),
      )
    }
    if (filters.includes('Startup')) {
      list = list.filter((j) =>
        /startup|labs|studios/i.test(j.company + j.summary),
      )
    }
    if (filters.includes('Enterprise')) {
      list = list.filter((j) =>
        /amazon|google|microsoft|enterprise|corp/i.test(j.company),
      )
    }

    return list.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
  }, [jobs, matchByJobId, filters])

  const selected =
    opportunities.find((o) => o.id === selectedId) ?? opportunities[0] ?? null

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { saved: jobs.length }
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1
    }
    return counts
  }, [applications, jobs.length])

  async function onDelete(jobId: string) {
    if (!window.confirm('Remove this opportunity from your engine?')) return
    try {
      await deleteJob(jobId)
      setJobs((current) => current.filter((j) => j.id !== jobId))
      if (selectedId === jobId) setSelectedId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-5 text-cyber-fg">
      <AIMatchingHeader opportunityCount={total} />

      {error ? <ErrorBanner message={error} /> : null}

      <JobSearchAI
        query={query}
        onQueryChange={setQuery}
        onSearch={() => void refresh(query)}
        activeFilters={filters}
        onToggleFilter={(filter) =>
          setFilters((current) =>
            current.includes(filter)
              ? current.filter((f) => f !== filter)
              : [...current, filter],
          )
        }
      />

      <ProfileJobDiscovery
        resumeId={primaryResumeId}
        onDiscovered={(result) => {
          setSelectedId(result.imported[0]?.job.id ?? null)
          void refresh(query)
        }}
      />

      {loading ? (
        <LoadingState label="AI recruiter is scanning opportunities…" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h2 className="cyber-h3">AI Job Discovery</h2>
              <p className="cyber-label text-cyber-muted-fg">
                {opportunities.length} ranked recommendations
              </p>
            </div>
            {opportunities.length === 0 ? (
              <div className="cyber-card p-8 text-center">
                <p className="cyber-body-muted">
                  No opportunities yet. Use “Find jobs for my profile” to pull
                  live listings from job portals.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {opportunities.map((job) => (
                  <li key={job.id}>
                    <JobRecommendationCard
                      job={job}
                      selected={selected?.id === job.id}
                      onSelect={() => setSelectedId(job.id)}
                      onRemove={() => void onDelete(job.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-5">
            <JobInsightPanel job={selected} />
            <ApplicationPipeline counts={statusCounts} />
          </div>
        </div>
      )}
    </div>
  )
}

