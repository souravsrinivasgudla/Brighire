import { Link, NavLink, Outlet } from 'react-router-dom'

import { BrandLogo } from '../components/BrandLogo'
import { Avatar } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resumes', label: 'Resumes' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/applications', label: 'Applications' },
]

export function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-20 overflow-visible border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <BrandLogo to="/dashboard" />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 ${
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30"
            aria-label="Open profile settings"
          >
            <Avatar name={user?.full_name ?? 'User'} size="md" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-950">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </Link>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden"
          aria-label="Mobile"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 ${
                  isActive
                    ? 'bg-slate-950 text-white'
                    : 'bg-white/80 text-slate-600'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
