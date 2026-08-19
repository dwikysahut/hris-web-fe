import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from '../../lib/nav'
import { classNames } from '../../lib/utils'

export function Sidebar() {
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

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    classNames(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'text-[var(--series-1)]' : 'text-[var(--text-secondary)] hover:bg-[var(--page-plane)]'
                    )
                  }
                  style={({ isActive }) => (isActive ? { background: 'rgba(42,120,214,0.1)' } : {})}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-4 mt-0 shrink-0 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-medium text-[var(--text-secondary)]">Data Simulasi</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Seluruh data pada dashboard ini adalah data dummy untuk keperluan demo.
        </p>
      </div>

      <div className="shrink-0 px-6 pb-4 text-[11px] text-[var(--text-muted)]">© 2023 HRIS</div>
    </aside>
  )
}
