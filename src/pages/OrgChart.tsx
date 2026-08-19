import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { useData } from '../lib/dataStore'
import { initials } from '../lib/utils'
import type { Department, Employee } from '../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]

const LEVEL_ORDER: Employee['level'][] = ['Director', 'Head', 'Manager', 'Supervisor', 'Staff']

export default function OrgChart() {
  const { employees } = useData()
  const active = useMemo(() => employees.filter((e) => e.status !== 'Nonaktif'), [employees])
  const [expanded, setExpanded] = useState<Department | null>('Engineering')

  const byDepartment = useMemo(() => {
    return DEPARTMENTS.map((department) => {
      const members = active.filter((e) => e.department === department)
      const leads = members.filter((e) => e.level === 'Director' || e.level === 'Head')
      const levelCounts = LEVEL_ORDER.map((level) => ({
        level,
        count: members.filter((m) => m.level === level).length,
      }))
      return { department, members, leads, levelCounts }
    })
  }, [active])

  const directors = active.filter((e) => e.level === 'Director')

  return (
    <AppShell title="Struktur Organisasi" subtitle="Peta departemen, jenjang jabatan, dan jajaran pimpinan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Departemen" value={DEPARTMENTS.length.toString()} />
        <StatCard label="Total Karyawan Aktif" value={active.length.toLocaleString('id-ID')} />
        <StatCard label="Direktur" value={directors.length.toString()} deltaLabel="memimpin organisasi" />
        <StatCard
          label="Rasio Manajerial"
          value={`1 : ${Math.round(
            active.filter((e) => e.level === 'Staff' || e.level === 'Supervisor').length /
              Math.max(1, active.filter((e) => e.level === 'Manager' || e.level === 'Head').length)
          )}`}
          deltaLabel="staf per manajer"
        />
      </div>

      {directors.length > 0 && (
        <Card className="mt-4" title="Jajaran Direksi">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directors.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: 'var(--series-7)' }}
                >
                  {initials(d.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{d.name}</div>
                  <div className="truncate text-xs text-[var(--text-muted)]">{d.position}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {byDepartment.map(({ department, members, leads, levelCounts }) => {
          const isOpen = expanded === department
          return (
            <Card key={department} className="p-0! overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : department)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white"
                    style={{ background: 'var(--series-1)' }}
                  >
                    {members.length}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{department}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {leads.length > 0 ? `Dipimpin oleh ${leads.map((l) => l.name).join(', ')}` : 'Belum ada pemimpin departemen'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden gap-1.5 sm:flex">
                    {levelCounts
                      .filter((l) => l.count > 0)
                      .map((l) => (
                        <Badge key={l.level} tone="neutral">
                          {l.level} · {l.count}
                        </Badge>
                      ))}
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[var(--text-muted)] transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </button>
              {isOpen && (
                <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {members
                      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
                      .map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: 'var(--gridline)' }}>
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ background: 'var(--series-3)' }}
                          >
                            {initials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{m.name}</div>
                            <div className="truncate text-xs text-[var(--text-muted)]">
                              {m.position} · {m.level}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}
