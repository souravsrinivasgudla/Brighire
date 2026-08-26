import { useEffect, useMemo, useState } from 'react'

import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplicationStatus,
} from '../../api/applications'
import { getDashboard } from '../../api/dashboard'
import { listJobs } from '../../api/jobs'
import { listResumes } from '../../api/resumes'
import type {
  Application,
  ApplicationStatus,
  DashboardMatch,
  Job,
  Resume,
} from '../../types/api'
import { getErrorMessage } from '../../utils/errors'
import { Button } from '../ui/Button'
import { AICareerAssistant } from './AICareerAssistant'
import {
  ApplicationCard,
  type ApplicationCardData,
} from './ApplicationCard'
import { ApplicationDetails } from './ApplicationDetails'
import { CareerPipeline } from './CareerPipeline'
import { InterviewCoach } from './InterviewCoach'

function buildCard(
  app: Application,
  job: Job | undefined,
  resume: Resume | undefined,
  match: DashboardMatch | undefined,
): ApplicationCardData {
  const matchScore = match?.match_score ?? 78 + (app.status === 'interview' ? 8 : 0)
  const interviewProbability =
    app.status === 'interview'
      ? 86
      : app.status === 'offer'
        ? 94
        : Math.min(88, 55 + Math.round(matchScore / 3))

  const nextAction =
    app.status === 'interview'
      ? 'Prepare system design questions.'
      : app.status === 'offer'
        ? 'Review compensation and negotiate timeline.'
        : app.status === 'reviewing'
          ? 'Send a concise follow-up in 3 days.'
          : 'Strengthen resume keywords for this role.'

  return {
    id: app.id,
    title: job?.title ?? 'Role',
    company: job?.company ?? 'Company',
    status: app.status,
    matchScore: Math.round(matchScore),
    interviewProbability,
    insight:
      match?.summary?.slice(0, 120) ||
      'Your FastAPI experience aligns strongly with this role.',
    nextAction,
    createdAt: app.created_at,
    jobId: app.job_id,
    resumeId: app.resume_id,
    resumeName: resume?.filename ?? 'Resume',
    coverLetter: app.cover_letter,
  }
}

export function ApplicationDashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [matches, setMatches] = useState<DashboardMatch[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    job_id: '',
    resume_id: '',
    cover_letter: '',
  })
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [apps, jobData, resumeData, dash] = await Promise.all([
        listApplications(),
        listJobs({ page_size: 100 }),
        listResumes(),
        getDashboard(),
      ])
      setApplications(apps)
      setJobs(jobData.items)
      setResumes(resumeData)
      setMatches(dash.top_matches)
      setSelectedId((current) => current ?? apps[0]?.id ?? null)
      setForm((f) => ({
        ...f,
        job_id: f.job_id || jobData.items[0]?.id || '',
        resume_id: f.resume_id || resumeData[0]?.id || '',
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const jobMap = useMemo(
    () => new Map(jobs.map((j) => [j.id, j])),
    [jobs],
  )
  const resumeMap = useMemo(
    () => new Map(resumes.map((r) => [r.id, r])),
    [resumes],
  )
  const matchByJob = useMemo(
    () => new Map(matches.map((m) => [m.job_id, m])),
    [matches],
  )

  const cards = useMemo(
    () =>
      applications.map((app) =>
        buildCard(
          app,
          jobMap.get(app.job_id),
          resumeMap.get(app.resume_id),
          matchByJob.get(app.job_id),
        ),
      ),
    [applications, jobMap, resumeMap, matchByJob],
  )

  const selected = cards.find((c) => c.id === selectedId) ?? null

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const app of applications) {
      c[app.status] = (c[app.status] ?? 0) + 1
    }
    return c
  }, [applications])

  async function onStatusChange(id: string, status: ApplicationStatus) {
    setError(null)
    try {
      const updated = await updateApplicationStatus(id, status)
      setApplications((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Remove this application from your pipeline?')) return
    try {
      await deleteApplication(id)
      setApplications((current) => current.filter((item) => item.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function onCreate() {
    setSaving(true)
    setError(null)
    try {
      await createApplication({
        job_id: form.job_id,
        resume_id: form.resume_id,
        cover_letter: form.cover_letter || null,
      })
      setShowForm(false)
      setForm((f) => ({ ...f, cover_letter: '' }))
      await refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <CareerPipeline counts={counts} total={applications.length} />

      {error ? (
        <div
          role="alert"
          className="border border-cyber-destructive/40 bg-cyber-destructive/10 px-4 py-3 text-sm text-cyber-destructive cyber-chamfer-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="cyber-h3">Application Intelligence Board</h2>
        <Button
          type="button"
          variant={showForm ? 'outline' : 'glitch'}
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Close form' : 'New application'}
        </Button>
      </div>

      {showForm ? (
        <div className="cyber-card p-5">
          {jobs.length === 0 || resumes.length === 0 ? (
            <p className="cyber-body-muted">
              You need at least one job and one resume before applying.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="cyber-label">
                Job
                <select
                  value={form.job_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_id: e.target.value }))
                  }
                  className="mt-1 w-full border border-cyber-border bg-cyber-muted px-3 py-2 text-sm normal-case tracking-normal text-cyber-fg cyber-chamfer-sm"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.company}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cyber-label">
                Resume
                <select
                  value={form.resume_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, resume_id: e.target.value }))
                  }
                  className="mt-1 w-full border border-cyber-border bg-cyber-muted px-3 py-2 text-sm normal-case tracking-normal text-cyber-fg cyber-chamfer-sm"
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.filename}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cyber-label md:col-span-2">
                Cover letter (optional)
                <textarea
                  value={form.cover_letter}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cover_letter: e.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full border border-cyber-border bg-cyber-muted px-3 py-2 text-sm normal-case tracking-normal text-cyber-fg cyber-chamfer-sm"
                />
              </label>
              <Button
                type="button"
                variant="glitch"
                loading={saving}
                onClick={() => void onCreate()}
                className="md:col-span-2 md:w-fit"
              >
                Create application
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center cyber-body-muted">
          Syncing your career journey…
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {cards.length === 0 ? (
              <div className="cyber-card p-8 text-center cyber-body-muted">
                No applications yet. Create one to start the intelligence board.
              </div>
            ) : (
              cards.map((card) => (
                <ApplicationCard
                  key={card.id}
                  app={card}
                  selected={selected?.id === card.id}
                  onSelect={() => setSelectedId(card.id)}
                  onStatusChange={(status) =>
                    void onStatusChange(card.id, status)
                  }
                  onDelete={() => void onDelete(card.id)}
                />
              ))
            )}
          </div>
          <ApplicationDetails app={selected} />
        </div>
      )}

      <InterviewCoach />
      <AICareerAssistant />
    </div>
  )
}
