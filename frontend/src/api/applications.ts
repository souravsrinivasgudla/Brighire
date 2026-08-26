import { apiClient } from './client'
import type {
  Application,
  ApplicationCreatePayload,
  ApplicationStatus,
} from '../types/api'

export async function listApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>('/applications')
  return data
}

export async function getApplication(
  applicationId: string,
): Promise<Application> {
  const { data } = await apiClient.get<Application>(
    `/applications/${applicationId}`,
  )
  return data
}

export async function createApplication(
  payload: ApplicationCreatePayload,
): Promise<Application> {
  const { data } = await apiClient.post<Application>('/applications', payload)
  return data
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> {
  const { data } = await apiClient.patch<Application>(
    `/applications/${applicationId}`,
    { status },
  )
  return data
}

export async function deleteApplication(applicationId: string): Promise<void> {
  await apiClient.delete(`/applications/${applicationId}`)
}
