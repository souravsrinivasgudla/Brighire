import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  analyzeResume,
  getResume,
  getResumeAnalysis,
  listResumes,
  uploadResume,
} from '../api/resumes'
import { ResumeWorkspace } from '../components/resume/ResumeWorkspace'
import { Button, ErrorBanner, LoadingState } from '../components/ui'
import type { Resume, ResumeAnalysis } from '../types/api'
import { ApiError, getErrorMessage } from '../utils/errors'

export function ResumeDetailPage() {
  const { resumeId = '' } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState<Resume | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [versions, setVersions] = useState<Resume[]>([])
  const [versionScores, setVersionScores] = useState<
    Record<string, number | undefined>
  >({})
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [resumeData, allResumes] = await Promise.all([
        getResume(resumeId),
        listResumes(),
      ])
      setResume(resumeData)
      setVersions(allResumes)

      try {
        const analysisData = await getResumeAnalysis(resumeId)
        setAnalysis(analysisData)
        setVersionScores((current) => ({
          ...current,
          [resumeId]: analysisData.overall_score,
        }))
      } catch (err) {
        if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
          setAnalysis(null)
        } else {
          throw err
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setResume(null)
    } finally {
      setLoading(false)
    }
  }, [resumeId])

  useEffect(() => {
    void load()
  }, [load])

  async function onAnalyze() {
    setAnalyzing(true)
    setError(null)
    try {
      const result = await analyzeResume(resumeId)
      setAnalysis(result)
      setVersionScores((current) => ({
        ...current,
        [resumeId]: result.overall_score,
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  async function onReplace(file: File) {
    setError(null)
    try {
      const created = await uploadResume(file)
      void navigate(`/resumes/${created.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return <LoadingState label="Opening resume intelligence lab…" />
  }

  if (!resume) {
    return (
      <div className="cyber-card p-8 text-center text-cyber-fg">
        <h2 className="cyber-h3">Resume not found</h2>
        <p className="mt-2 cyber-body-muted">
          This document may have been deleted.
        </p>
        <Link to="/resumes" className="mt-5 inline-block">
          <Button variant="outline">Back to library</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-cyber-fg">
      {error ? <ErrorBanner message={error} /> : null}
      <ResumeWorkspace
        resume={resume}
        analysis={analysis}
        analyzing={analyzing}
        versions={versions}
        versionScores={versionScores}
        onAnalyze={() => void onAnalyze()}
        onReplace={(file) => void onReplace(file)}
      />
    </div>
  )
}

