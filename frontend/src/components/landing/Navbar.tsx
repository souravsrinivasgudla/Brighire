import { Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'

import { BrandLogo } from '../BrandLogo'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { href: '#resume-scanner', label: 'Features' },
  { href: '#career-dna', label: 'Analysis' },
  { href: '#job-matching', label: 'Matching' },
  { href: '#ai-coach', label: 'Coach' },
]

export function Navbar() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:top-6">
      <header className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3 border border-cyber-border bg-cyber-card/90 px-4 py-2 backdrop-blur-sm cyber-chamfer-sm">
        <BrandLogo to="/" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="glitch" size="sm">
                Open Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="glitch" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-cyber-border bg-cyber-muted text-cyber-fg lg:hidden cyber-chamfer-sm cyber-focus"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5 cyber-icon" strokeWidth={1.5} /> : <Menu className="h-5 w-5 cyber-icon" strokeWidth={1.5} />}
        </button>
      </header>

      {open ? (
        <div id={menuId} className="pointer-events-auto mx-auto mt-3 max-w-7xl cyber-card p-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-3 font-mono text-sm uppercase tracking-wider text-cyber-fg hover:text-cyber-accent"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-cyber-border pt-3">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <Button variant="glitch" className="w-full">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  <Button variant="glitch" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
