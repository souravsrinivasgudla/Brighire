import { Briefcase, FileSearch, GitBranch, Home, Route, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: Home, end: true },
  { to: '/resumes', label: 'Resume Intel', icon: FileSearch },
  { to: '/jobs', label: 'Job Matches', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: Route },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
]

const mobileItems = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/resumes', label: 'Resumes', icon: FileSearch },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Apps', icon: Route },
  { to: '/profile', label: 'Profile', icon: User },
]

const linkBase =
  'group flex min-h-11 items-center gap-3 border-l-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all duration-150 cyber-focus'
const linkIdle =
  'border-transparent text-cyber-muted-fg hover:bg-cyber-accent/10 hover:text-cyber-accent'
const linkActive =
  'border-cyber-accent bg-cyber-accent/10 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'

export function Sidebar() {
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col cyber-card p-4">
          <NavLink to="/dashboard" className="mb-6 flex items-center gap-3 px-2 py-2 cyber-focus">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-cyber-accent bg-cyber-muted font-display text-sm font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]">
              B
            </span>
            <span className="font-display text-xs font-bold uppercase tracking-widest text-cyber-fg">
              BRIGHT<span className="text-cyber-accent">HIRE</span>
            </span>
          </NavLink>

          <nav className="flex flex-1 flex-col gap-0.5" aria-label="Dashboard">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkIdle}`
                  }
                >
                  <Icon className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <p className="mt-4 px-2 font-label text-[10px] uppercase tracking-[0.2em] text-cyber-muted-fg">
            // career intelligence v2.0
          </p>
        </div>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around border border-cyber-border bg-cyber-card/95 px-1 py-1 shadow-[var(--box-shadow-neon-sm)] backdrop-blur-sm lg:hidden cyber-chamfer-sm"
        aria-label="Mobile navigation"
      >
        {mobileItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 font-label text-[9px] uppercase tracking-wider cyber-focus ${
                  isActive ? 'text-cyber-accent' : 'text-cyber-muted-fg'
                }`
              }
            >
              <Icon className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
