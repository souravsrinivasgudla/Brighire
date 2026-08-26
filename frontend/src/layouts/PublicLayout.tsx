import { Link, Outlet } from 'react-router-dom'

import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/ui/Button'
import { CyberShell } from '../components/ui/CyberShell'

export function PublicLayout() {
  return (
    <CyberShell>
      <header className="relative z-10 border-b border-cyber-border bg-cyber-card/80 backdrop-blur-sm">
        <div className="cyber-container flex items-center justify-between py-4">
          <BrandLogo to="/" />
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/login"
              className="font-mono uppercase tracking-wider text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus px-2 py-1"
            >
              Log in
            </Link>
            <Link to="/register">
              <Button variant="glitch" size="sm">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="relative z-10">
        <Outlet />
      </main>
    </CyberShell>
  )
}
