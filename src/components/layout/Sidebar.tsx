import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_GROUPS } from '../../lib/nav'
import { classNames } from '../../lib/utils'

const GROUP_ICONS: Record<string, React.ReactNode> = {
  'Executive Dashboard': <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />,
  People: <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  Attendance: <path d="M8 3v4M16 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />,
  'Leave & Time Off': <path d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  Payroll: <path d="M3 6h18v12H3V6Zm0 5h18M7 15h4" />,
  Performance: <path d="M3 17l5-5 4 4 8-8M14 8h6v6" />,
  Analytics: <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />,
  Administration: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3.5 12h1M19.5 12h1M12 3.5v1M12 19.5v1M6 6l.7.7M17.3 17.3l.7.7M18 6l-.7.7M6.7 17.3 6 18" />,
  Lainnya: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />,
}

function GroupIcon({ label }: { label: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {GROUP_ICONS[label]}
    </svg>
  )
}

export function Sidebar() {
  const location = useLocation()
  const [query, setQuery] = useState('')

  const activeGroupLabel = useMemo(
    () => NAV_GROUPS.find((g) => g.items.some((i) => (i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to))))?.label,
    [location.pathname]
  )

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(activeGroupLabel ? [activeGroupLabel] : [NAV_GROUPS[0].label]))

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return null
    const q = query.trim().toLowerCase()
    return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) })).filter(
      (g) => g.items.length > 0
    )
  }, [query])

  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-[var(--surface-1)] lg:flex"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: 'var(--series-1)' }}
        >
          HR
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-[var(--text-primary)]">HRIS</div>
          <div className="text-xs leading-tight text-[var(--text-muted)]">Admin Dashboard</div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu..."
            className="w-full rounded-lg border bg-[var(--page-plane)] py-1.5 pl-8 pr-2.5 text-xs outline-none transition-colors focus:border-[var(--series-1)]"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {(filteredGroups ?? NAV_GROUPS).map((group) => {
          const isOpen = filteredGroups ? true : openGroups.has(group.label)
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <span className="text-[var(--text-muted)]">
                  <GroupIcon label={group.label} />
                </span>
                <span className="flex-1">{group.label}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={classNames('shrink-0 transition-transform', isOpen ? 'rotate-90' : '')}
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {isOpen && (
                <div className="mb-1 flex flex-col gap-0.5 pl-[27px]">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        classNames(
                          'relative rounded-lg py-1.5 pl-3 pr-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'font-semibold text-[var(--series-1)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--page-plane)] hover:text-[var(--text-primary)]'
                        )
                      }
                      style={({ isActive }) => (isActive ? { background: 'rgba(42,120,214,0.1)' } : {})}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute -left-[15px] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                              style={{ background: 'var(--series-1)' }}
                            />
                          )}
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredGroups && filteredGroups.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">Menu tidak ditemukan</p>
        )}
      </nav>

      <div className="m-4 mt-0 shrink-0 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium text-[var(--text-secondary)]">Data Simulasi</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Seluruh data pada dashboard ini adalah data dummy untuk keperluan demo.
        </p>
      </div>

      <div className="shrink-0 px-6 pb-4 text-[11px] text-[var(--text-muted)]">© 2024 HRIS</div>
    </aside>
  )
}
