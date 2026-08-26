import { Link } from 'react-router-dom'

import { BrandLogo } from '../BrandLogo'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Resume Intelligence', href: '#resume-scanner' },
      { label: 'Career DNA', href: '#career-dna' },
      { label: 'Job Matching', href: '#job-matching' },
      { label: 'AI Coach', href: '#ai-coach' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', href: '/login' },
      { label: 'Get started', href: '/register' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-cyber-border bg-cyber-bg">
      <div className="cyber-container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLogo to="/" />
            <p className="cyber-body-muted mt-4 max-w-sm">
              Your AI career intelligence engine — analyze, match, and coach your
              next chapter.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="cyber-label text-cyber-fg">{col.title}</p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="cyber-body-muted mt-12 border-t border-cyber-border pt-6 text-sm">
          © {new Date().getFullYear()} BrightHire AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
