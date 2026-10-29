export type User = {
  id: string
  email: string
  full_name: string
  is_active: boolean
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  full_name: string
  password: string
}

export type UserUpdatePayload = {
  full_name?: string | null
}

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
  reset_token: string | null
}

export type ResetPasswordPayload = {
  token: string
  new_password: string
}

export type ApiErrorBody = {
  detail?: string | Array<{ msg?: string; loc?: unknown[] }>
}

export type Resume = {
  id: string
  user_id: string
  filename: string
  is_primary: boolean
  extracted_text: string | null
  created_at: string
  updated_at: string
}

export type ResumeAnalysis = {
  id: string
  resume_id: string
  overall_score: number
  summary: string
  skills: string[]
  strengths: string[]
  weaknesses: string[]
  missing_skills: string[]
  suggestions: string[]
  created_at: string
  updated_at: string
}

export type Job = {
  id: string
  user_id: string
  title: string
  company: string
  location: string | null
  description: string
  requirements: string | null
  source: string | null
  url: string | null
  created_at: string
  updated_at: string
}

export type JobDiscoveryPayload = {
  resume_id?: string
  query?: string
  location?: string
  country?: string
  limit?: number
}

export type DiscoveredJob = {
  job: Job
  match_score: number | null
}

export type JobDiscoveryResponse = {
  resume_id: string
  queries: string[]
  location: string | null
  imported: DiscoveredJob[]
  skipped_duplicates: number
  source_errors: string[]
  discovered_at: string
}

export type JobCreatePayload = {
  title: string
  company: string
  location?: string | null
  description: string
  requirements?: string | null
}

export type JobUpdatePayload = Partial<JobCreatePayload>

export type JobListResponse = {
  items: Job[]
  page: number
  page_size: number
  total: number
  pages: number
}

export type JobListParams = {
  search?: string
  location?: string
  company?: string
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'title' | 'company' | 'match_score'
  resume_id?: string
}

export type ResumeJobMatch = {
  id: string
  resume_id: string
  job_id: string
  match_score: number
  summary: string
  matched_skills: string[]
  missing_skills: string[]
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  created_at: string
  updated_at: string
}

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export type Application = {
  id: string
  user_id: string
  job_id: string
  resume_id: string
  status: ApplicationStatus
  cover_letter: string | null
  created_at: string
  updated_at: string
}

export type ApplicationCreatePayload = {
  job_id: string
  resume_id: string
  cover_letter?: string | null
}

export type DashboardMatch = {
  id: string
  resume_id: string
  job_id: string
  job_title: string
  company: string
  location: string | null
  match_score: number
  summary: string
}

export type Dashboard = {
  resume_count: number
  analysis_count: number
  match_count: number
  average_match_score: number | null
  primary_resume_id: string | null
  primary_filename: string | null
  top_matches: DashboardMatch[]
}

export type DashboardResume = {
  resume: {
    id: string
    filename: string
    created_at: string
  }
  analysis: ResumeAnalysis | null
  match_count: number
  average_match_score: number | null
  top_matches: DashboardMatch[]
}
