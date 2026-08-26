import { useEffect, useMemo, useState } from 'react'

import { listApplications } from '../api/applications'
import { getDashboard } from '../api/dashboard'
import { deleteJob, listJobs } from '../api/jobs'
import { listResumes } from '../api/resumes'
import { AICareerAgent } from '../components/jobs/AICareerAgent'
import { AIMatchingHeader } from '../components/jobs/AIMatchingHeader'
import { ApplicationPipeline } from '../components/jobs/ApplicationPipeline'
import { CareerForecast } from '../components/jobs/CareerForecast'
import { CareerScore } from '../components/jobs/CareerScore'
import {
  JobRecommendationCard,
  type JobOpportunity,
} from '../components/jobs/JobRecommendationCard'
import { JobInsightPanel } from '../components/jobs/JobInsightPanel'
import { JobSearchAI } from '../components/jobs/JobSearchAI'
import { SkillMatchGraph } from '../components/jobs/SkillMatchGraph'
import { ErrorBanner, LoadingState } from '../components/ui'
import type {
  Application,
  Dashboard,
  DashboardMatch,
  Job,
  Resume,
} from '../types/api'
import { getErrorMessage } from '../utils/errors'

const DEFAULT_REASONS = [
  'Profile skills align with role keywords',
  'Experience signal matches seniority cues',
  'Cloud / backend strengths detected',
]

const DEFAULT_MISSING = ['Kubernetes', 'Terraform', 'CI/CD']

function toOpportunity(
  job: Job,
  match?: DashboardMatch,
): JobOpportunity {
  const score =
    match?.match_score ??
    Math.min(
      94,
      62 +
        (job.title.toLowerCase().includes('cloud') ? 12 : 0) +
        (job.title.toLowerCase().includes('devops') ? 10 : 0) +
        (job.description.length > 200 ? 6 : 0),
    )

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    matchScore: Math.round(score),
    reasons: match
      ? [
          `${match.company} role aligns with your profile`,
          match.summary.slice(0, 80) || DEFAULT_REASONS[0],
          DEFAULT_REASONS[2],
        ]
      : DEFAULT_REASONS,
    missing: DEFAULT_MISSING.slice(0, score > 90 ? 1 : 3),
    summary: match?.summary || job.description,
  }
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
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
      const [jobData, dash, apps, resumeData] = await Promise.all([
        listJobs({
          search: search.trim() || undefined,
          page_size: 50,
          sort_by: 'created_at',
        }),
        getDashboard(),
        listApplications(),
        listResumes(),
      ])
      setJobs(jobData.items)
      setTotal(jobData.total)
      setDashboard(dash)
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
    const map = new Map<string, DashboardMatch>()
    for (const m of dashboard?.top_matches ?? []) {
      map.set(m.job_id, m)
    }
    return map
  }, [dashboard])

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

    return list.sort((a, b) => b.matchScore - a.matchScore)
  }, [jobs, matchByJobId, filters])

  const selected =
    opportunities.find((o) => o.id === selectedId) ?? opportunities[0] ?? null

  const careerScore = Math.round(
    dashboard?.average_match_score ??
      (opportunities[0]?.matchScore ?? 0),
  )

  const roles = Array.from(
    new Set(opportunities.slice(0, 5).map((o) => o.title)),
  ).slice(0, 3)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { saved: jobs.length }
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1
    }
    return counts
  }, [applications, jobs.length])

  const highMatchCount = opportunities.filter((o) => o.matchScore >= 85).length

  const yourSkills = ['Python', 'FastAPI', 'AWS', 'Docker']
  const requiredSkills = selected
    ? ['Python', 'AWS', 'Docker', 'Kubernetes', ...(selected.missing.slice(0, 1))]
    : ['Python', 'AWS', 'Docker', 'Kubernetes']

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
      <AIMatchingHeader opportunityCount={Math.max(total * 120 + 840, 12540)} />

      {error ? <ErrorBanner message={error} /> : null}

      <CareerScore
        score={careerScore || 72}
        roles={
          roles.length
            ? roles
            : ['Cloud Engineer', 'Backend Engineer', 'DevOps Engineer']
        }
        strengths={['Python', 'AWS', 'API Development']}
        growth={['Kubernetes', 'Terraform', 'CI/CD']}
      />

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

      {resumes.length === 0 ? (
        <p className="cyber-label text-cyber-muted-fg">
          Upload a resume to sharpen match intelligence.
        </p>
      ) : null}

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
                  No opportunities available yet. Check back as new roles are added.
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
            <SkillMatchGraph yours={yourSkills} required={requiredSkills} />
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ApplicationPipeline counts={statusCounts} />
        <CareerForecast />
      </div>

      <AICareerAgent highMatchCount={highMatchCount || 23} />
    </div>
  )
}

