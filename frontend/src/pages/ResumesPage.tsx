import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { deleteResume, listResumes, uploadResume } from '../api/resumes'
import { ResumeUploader } from '../components/resume/ResumeUploader'
import { Button, ErrorBanner, LoadingState } from '../components/ui'
import type { Resume } from '../types/api'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

export function ResumesPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setResumes(await listResumes())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const created = await uploadResume(file)
      void navigate(`/resumes/${created.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setUploading(false)
    }
  }

  async function onDelete(resumeId: string) {
    if (!window.confirm('Delete this resume from the lab?')) return
    setError(null)
    try {
      await deleteResume(resumeId)
      setResumes((current) => current.filter((item) => item.id !== resumeId))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return <LoadingState label="Loading resume lab…" />
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-4 text-cyber-fg">
        {error ? <ErrorBanner message={error} /> : null}
        <ResumeUploader uploading={uploading} onUpload={onUpload} />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-cyber-fg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cyber-label text-cyber-accent">Resume Library</p>
          <h1 className="mt-1 cyber-h3 text-2xl sm:text-3xl">
            Your documents in the AI lab
          </h1>
          <p className="mt-2 cyber-body-muted">
            Open a version to enter the intelligence workspace.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onUpload(file)
            }}
          />
          <Button
            type="button"
            variant="glitch"
            disabled={uploading}
            loading={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full sm:w-auto"
          >
            {uploading ? 'Uploading…' : 'Upload new resume'}
          </Button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <ul className="grid items-stretch gap-4 md:grid-cols-2">
        {resumes.map((resume) => (
          <li
            key={resume.id}
            className="flex h-full flex-col cyber-card cyber-card-hover p-5"
          >
            <h2 className="cyber-h3 break-words text-base">{resume.filename}</h2>
            <p className="mt-1 cyber-label text-cyber-muted-fg">
              Uploaded {formatDate(resume.created_at)}
            </p>
            <p className="mt-3 line-clamp-3 cyber-body-muted">
              {resume.extracted_text?.trim() ||
                'No extractable text was found in this file.'}
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link to={`/resumes/${resume.id}`}>
                <Button variant="default" size="sm">
                  Open lab
                </Button>
              </Link>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => void onDelete(resume.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

