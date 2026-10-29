import { useEffect, useState } from 'react'

import { getDashboard } from '../api/dashboard'
import { getResumeAnalysis, listResumes } from '../api/resumes'
import { CareerOverview } from '../components/dashboard/CareerOverview'
import { JobMatching } from '../components/dashboard/JobMatching'
import { ResumeIntelligence } from '../components/dashboard/ResumeIntelligence'
import { ErrorBanner, LoadingState } from '../components/ui'
import type { Dashboard, ResumeAnalysis } from '../types/api'
import { ApiError, getErrorMessage } from '../utils/errors'

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [dash, resumes] = await Promise.all([getDashboard(), listResumes()])
        if (cancelled) return
        setDashboard(dash)

        const primary =
          resumes.find((resume) => resume.is_primary) ??
          resumes.find((resume) => resume.id === dash.primary_resume_id) ??
          resumes[0]
        if (primary) {
          try {
            const analysisData = await getResumeAnalysis(primary.id)
            if (!cancelled) setAnalysis(analysisData)
          } catch (err) {
            if (!(err instanceof ApiError && (err.status === 404 || err.status === 409))) {
              throw err
            }
            if (!cancelled) setAnalysis(null)
          }
        }
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

  const careerScore =
    analysis?.overall_score ??
    (dashboard?.average_match_score != null
      ? Math.round(dashboard.average_match_score)
      : 0)

  const strongSkills = (analysis?.skills ?? analysis?.strengths ?? []).slice(0, 5)
  const improveSkills = (analysis?.missing_skills ?? analysis?.weaknesses ?? []).slice(0, 5)

  const summary =
    analysis?.summary ??
    (dashboard && dashboard.match_count > 0
      ? `Your profile is competitive across ${dashboard.match_count} matched roles with an average fit of ${Math.round(dashboard.average_match_score ?? 0)}%.`
      : 'Upload and analyze a resume to unlock your career intelligence score.')

  if (loading) {
    return <LoadingState label="Syncing your career OS…" />
  }

  return (
    <div className="space-y-6 text-cyber-fg">
      {error ? <ErrorBanner message={error} /> : null}

      <CareerOverview
        score={careerScore}
        strongSkills={strongSkills}
        improveSkills={improveSkills}
        summary={summary}
        primaryFilename={dashboard?.primary_filename}
      />

      <ResumeIntelligence
        ats={analysis ? Math.min(99, analysis.overall_score + 4) : careerScore || 0}
        keyword={
          analysis
            ? Math.min(99, Math.round(analysis.overall_score * 0.95))
            : Math.round((dashboard?.average_match_score ?? 0) * 0.9)
        }
        impact={analysis?.overall_score ?? careerScore}
        recommendations={analysis?.suggestions ?? []}
      />

      <JobMatching matches={dashboard?.top_matches ?? []} />
    </div>
  )
}
