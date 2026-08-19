import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'
import { initials } from '../lib/utils'

const ANNUAL_QUOTA = 12

interface BalanceRow {
  employeeId: string
  name: string
  department: string
  quota: number
  used: number
  remaining: number
}

export default function LeaveBalance() {
  const { employees, leaveRequests } = useData()
  const [query, setQuery] = useState('')

  const rows: BalanceRow[] = useMemo(() => {
    const active = employees.filter((e) => e.status !== 'Nonaktif')
    return active.map((e) => {
      const used = leaveRequests
        .filter((r) => r.employeeId === e.id && r.type === 'Cuti Tahunan' && r.status === 'Disetujui' && r.startDate.startsWith('2026'))
        .reduce((s, r) => s + r.days, 0)
      return {
        employeeId: e.id,
        name: e.name,
        department: e.department,
        quota: ANNUAL_QUOTA,
        used,
        remaining: Math.max(0, ANNUAL_QUOTA - used),
      }
    })
  }, [employees, leaveRequests])

  const filtered = rows.filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()))
  const lowBalance = rows.filter((r) => r.remaining <= 2).length
  const avgUsed = rows.length ? rows.reduce((s, r) => s + r.used, 0) / rows.length : 0

  const columns: Column<BalanceRow>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-6)' }}>
            {initials(r.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{r.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{r.department}</div>
          </div>
        </div>
      ),
      sortValue: (r) => r.name,
    },
    { key: 'quota', header: 'Jatah', align: 'right', render: (r) => r.quota, sortValue: (r) => r.quota },
    { key: 'used', header: 'Terpakai', align: 'right', render: (r) => r.used, sortValue: (r) => r.used },
    {
      key: 'remaining',
      header: 'Sisa',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums font-semibold" style={{ color: r.remaining <= 2 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
          {r.remaining}
        </span>
      ),
      sortValue: (r) => r.remaining,
    },
    {
      key: 'flag',
      header: 'Status',
      align: 'center',
      render: (r) => (r.remaining <= 2 ? <Badge tone="warning">Hampir Habis</Badge> : <Badge tone="good">Cukup</Badge>),
    },
  ]

  return (
    <AppShell title="Leave Balance" subtitle="Saldo cuti tahunan karyawan aktif — periode 2026">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Jatah Tahunan" value={`${ANNUAL_QUOTA} hari`} />
        <StatCard label="Rata-rata Terpakai" value={`${avgUsed.toFixed(1)} hari`} />
        <StatCard label="Saldo Hampir Habis" value={lowBalance.toLocaleString('id-ID')} positive={lowBalance === 0} deltaLabel="≤ 2 hari tersisa" />
      </div>
      <Card className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama karyawan..."
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm sm:max-w-xs"
          style={{ borderColor: 'var(--border)' }}
        />
        <DataTable columns={columns} rows={filtered} pageSize={10} />
      </Card>
    </AppShell>
  )
}
