import { Outlet } from 'react-router-dom'

import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Sidebar } from '../components/dashboard/Sidebar'
import { CyberShell } from '../components/ui/CyberShell'

export function DashboardLayout() {
  return (
    <CyberShell>
      <div className="cyber-container flex min-h-screen gap-4 py-4 pb-24 lg:gap-5 lg:pb-5">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <DashboardHeader />
          <main className="min-h-0 flex-1 overflow-y-auto cyber-card cyber-scrollbar p-4 sm:p-6 lg:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </CyberShell>
  )
}
