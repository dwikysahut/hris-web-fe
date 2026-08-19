import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_GROUPS } from '../../lib/nav'
import { classNames } from '../../lib/utils'
import { useAuth } from '../../lib/authStore'

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-[var(--surface-1)]/95 backdrop-blur" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md border p-2 lg:hidden"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Buka menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
            {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 hover:bg-[var(--page-plane)]"
          >
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{user?.role}</div>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--series-7)' }}
            >
              ADM
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border bg-[var(--surface-1)] py-1 shadow-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  onClick={handleLogout}
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
                >
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto border-t px-4 py-3 lg:hidden" style={{ borderColor: 'var(--border)' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    classNames(
                      'block rounded-lg px-3 py-2 text-sm font-medium',
                      isActive ? 'text-[var(--series-1)]' : 'text-[var(--text-secondary)]'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  )
}
