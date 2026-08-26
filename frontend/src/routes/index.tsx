import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '../auth/ProtectedRoute'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LandingLayout } from '../layouts/LandingLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AICoachPage } from '../pages/AICoachPage'
import { ApplicationsPage } from '../pages/ApplicationsPage'
import { CareerDnaPage } from '../pages/CareerDnaPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { HomePage } from '../pages/HomePage'
import { JobDetailPage } from '../pages/JobDetailPage'
import { JobsPage } from '../pages/JobsPage'
import { LoginPage } from '../pages/LoginPage'
import { PipelinePage } from '../pages/PipelinePage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { ResumeDetailPage } from '../pages/ResumeDetailPage'
import { ResumesPage } from '../pages/ResumesPage'
import { RoadmapPage } from '../pages/RoadmapPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="resumes/:resumeId" element={<ResumeDetailPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:jobId" element={<JobDetailPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="ai-coach" element={<AICoachPage />} />
            <Route path="career-dna" element={<CareerDnaPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
