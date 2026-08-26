import { apiClient } from './client'
import type { Resume, ResumeAnalysis, ResumeJobMatch } from '../types/api'

export async function listResumes(): Promise<Resume[]> {
  const { data } = await apiClient.get<Resume[]>('/resumes')
  return data
}

export async function getResume(resumeId: string): Promise<Resume> {
  const { data } = await apiClient.get<Resume>(`/resumes/${resumeId}`)
  return data
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<Resume>('/resumes', formData)
  return data
}

export async function deleteResume(resumeId: string): Promise<void> {
  await apiClient.delete(`/resumes/${resumeId}`)
}

export async function analyzeResume(
  resumeId: string,
): Promise<ResumeAnalysis> {
  const { data } = await apiClient.post<ResumeAnalysis>(
    `/resumes/${resumeId}/analyze`,
  )
  return data
}

export async function getResumeAnalysis(
  resumeId: string,
): Promise<ResumeAnalysis> {
  const { data } = await apiClient.get<ResumeAnalysis>(
    `/resumes/${resumeId}/analysis`,
  )
  return data
}

export async function getResumeMatches(
  resumeId: string,
): Promise<ResumeJobMatch[]> {
  const { data } = await apiClient.get<ResumeJobMatch[]>(
    `/resumes/${resumeId}/matches`,
  )
  return data
}
