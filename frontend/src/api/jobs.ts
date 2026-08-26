import { apiClient } from './client'
import type {
  Job,
  JobCreatePayload,
  JobListParams,
  JobListResponse,
  JobUpdatePayload,
  ResumeJobMatch,
} from '../types/api'

export async function listJobs(
  params: JobListParams = {},
): Promise<JobListResponse> {
  const { data } = await apiClient.get<JobListResponse>('/jobs', { params })
  return data
}

export async function getJob(jobId: string): Promise<Job> {
  const { data } = await apiClient.get<Job>(`/jobs/${jobId}`)
  return data
}

export async function createJob(payload: JobCreatePayload): Promise<Job> {
  const { data } = await apiClient.post<Job>('/jobs', payload)
  return data
}

export async function updateJob(
  jobId: string,
  payload: JobUpdatePayload,
): Promise<Job> {
  const { data } = await apiClient.put<Job>(`/jobs/${jobId}`, payload)
  return data
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}`)
}

export async function createJobMatch(
  jobId: string,
  resumeId: string,
): Promise<ResumeJobMatch> {
  const { data } = await apiClient.post<ResumeJobMatch>(
    `/jobs/${jobId}/match/${resumeId}`,
  )
  return data
}

export async function getJobMatch(
  jobId: string,
  resumeId: string,
): Promise<ResumeJobMatch> {
  const { data } = await apiClient.get<ResumeJobMatch>(
    `/jobs/${jobId}/match/${resumeId}`,
  )
  return data
}
