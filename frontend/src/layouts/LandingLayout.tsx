import { Outlet } from 'react-router-dom'

import { CyberShell } from '../components/ui/CyberShell'

export function LandingLayout() {
  return (
    <CyberShell scanlineBeam>
      <Outlet />
    </CyberShell>
  )
}
