import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'

import { createApplication } from '../api/applications'
import {
  createJobMatch,
  getJob,
  getJobMatch,
  updateJob,
} from '../api/jobs'
import { listResumes } from '../api/resumes'
import { SelectField } from '../components/SelectField'
import { TextAreaField, TextField } from '../components/TextField'
import { Button } from '../components/ui/Button'
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  Panel,
  ScoreBadge,
  SectionTitle,
  SuccessBanner,
  TagList,
} from '../components/ui'
import type { Job, Resume, ResumeJobMatch } from '../types/api'
import { ApiError, getErrorMessage } from '../utils/errors'

const jobSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  company: z.string().min(2, 'Company is required.'),
  location: z.string().optional(),
  description: z.string().min(10, 'Add a fuller description.'),
  requirements: z.string().optional(),
})

type JobFormValues = z.infer<typeof jobSchema>

export function JobDetailPage() {
  const { jobId = '' } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumeId, setResumeId] = useState('')
  const [match, setMatch] = useState<ResumeJobMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobData, resumeData] = await Promise.all([
        getJob(jobId),
        listResumes(),
      ])
      setJob(jobData)
      setResumes(resumeData)
      setResumeId((current) => current || resumeData[0]?.id || '')
      reset({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location ?? '',
        description: jobData.description,
        requirements: jobData.requirements ?? '',
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [jobId, reset])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false

    async function loadExistingMatch() {
      if (!resumeId) {
        setMatch(null)
        return
      }
      try {
        const existing = await getJobMatch(jobId, resumeId)
        if (!cancelled) setMatch(existing)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 409)) {
            setMatch(null)
          }
        }
      }
    }

    void loadExistingMatch()
    return () => {
      cancelled = true
    }
  }, [jobId, resumeId])

  const onSave = handleSubmit(async (values) => {
    setError(null)
    setNotice(null)
    try {
      const updated = await updateJob(jobId, {
        title: values.title,
        company: values.company,
        location: values.location || null,
        description: values.description,
        requirements: values.requirements || null,
      })
      setJob(updated)
      setNotice('Job updated.')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  async function onMatch() {
    if (!resumeId) {
      setError('Select a resume to match.')
      return
    }
    setMatching(true)
    setError(null)
    setNotice(null)
    try {
      setMatch(await createJobMatch(jobId, resumeId))
      setNotice('Match ready.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setMatching(false)
    }
  }

  async function onApply() {
    if (!resumeId) {
      setError('Select a resume to apply with.')
      return
    }
    setApplying(true)
    setError(null)
    setNotice(null)
    try {
      await createApplication({ job_id: jobId, resume_id: resumeId })
      setNotice('Application created.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <LoadingState label="Loading job…" />
  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        description="This job may have been deleted."
        action={
          <Link to="/jobs">
            <Button variant="outline">Back to jobs</Button>
          </Link>
        }
      />
    )
  }

  return (
    <section className="space-y-6 text-cyber-fg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="cyber-label text-cyber-accent">Job</p>
          <h1 className="cyber-h3 text-2xl sm:text-3xl">{job.title}</h1>
          <p className="cyber-body-muted">
            {job.company}
            {job.location ? ` · ${job.location}` : ''}
          </p>
        </div>
        <Link to="/jobs">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionTitle>Edit job</SectionTitle>
          <form className="mt-4 grid gap-4" onSubmit={onSave}>
            <TextField
              label="Title"
              error={errors.title?.message}
              {...register('title')}
            />
            <TextField
              label="Company"
              error={errors.company?.message}
              {...register('company')}
            />
            <TextField label="Location" {...register('location')} />
            <TextAreaField
              label="Description"
              error={errors.description?.message}
              {...register('description')}
            />
            <TextAreaField
              label="Requirements"
              {...register('requirements')}
            />
            <Button type="submit" variant="glitch" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <SectionTitle>Match & apply</SectionTitle>
            {resumes.length === 0 ? (
              <p className="mt-3 cyber-body-muted">
                Upload a resume first, then return here to match.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <SelectField
                  label="Resume"
                  value={resumeId}
                  onChange={(event) => setResumeId(event.target.value)}
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.filename}
                    </option>
                  ))}
                </SelectField>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    variant="glitch"
                    onClick={() => void onMatch()}
                    disabled={matching}
                    loading={matching}
                  >
                    {matching ? 'Matching…' : 'Run AI match'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void onApply()}
                    disabled={applying}
                    loading={applying}
                  >
                    {applying ? 'Applying…' : 'Create application'}
                  </Button>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-3">
              <SectionTitle>Match result</SectionTitle>
              {match ? <ScoreBadge score={match.match_score} /> : null}
            </div>
            {!match ? (
              <p className="mt-3 cyber-body-muted">
                Run a match to see score, skill overlap, and recommendations.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="cyber-body-muted">{match.summary}</p>
                <div>
                  <h3 className="cyber-label text-cyber-accent">Matched skills</h3>
                  <div className="mt-2">
                    <TagList items={match.matched_skills} />
                  </div>
                </div>
                <div>
                  <h3 className="cyber-label text-cyber-accent-secondary">
                    Missing skills
                  </h3>
                  <div className="mt-2">
                    <TagList items={match.missing_skills} />
                  </div>
                </div>
                <div>
                  <h3 className="cyber-label text-cyber-accent">Strengths</h3>
                  <div className="mt-2">
                    <TagList items={match.strengths} />
                  </div>
                </div>
                <div>
                  <h3 className="cyber-label text-cyber-accent-secondary">Gaps</h3>
                  <div className="mt-2">
                    <TagList items={match.gaps} />
                  </div>
                </div>
                <div>
                  <h3 className="cyber-label text-cyber-accent-tertiary">
                    Recommendations
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 cyber-body-muted">
                    {match.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </section>
  )
}
