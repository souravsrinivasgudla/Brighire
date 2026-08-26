import { apiClient } from './client'
import type { Dashboard, DashboardResume } from '../types/api'

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>('/dashboard')
  return data
}

export async function getResumeDashboard(
  resumeId: string,
): Promise<DashboardResume> {
  const { data } = await apiClient.get<DashboardResume>(
    `/dashboard/resumes/${resumeId}`,
  )
  return data
}
