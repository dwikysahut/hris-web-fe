import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, employeeStatusTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { Employee, EmployeeStatus } from '../lib/types'

const STATUSES: EmployeeStatus[] = ['Aktif', 'Cuti Panjang', 'Nonaktif']

export default function EmploymentStatus() {
  const { employees } = useData()
  const [status, setStatus] = useState<'Semua' | EmployeeStatus>('Semua')

  const counts = useMemo(() => {
    const map = new Map<EmployeeStatus, number>()
    for (const s of STATUSES) map.set(s, 0)
    for (const e of employees) map.set(e.status, (map.get(e.status) ?? 0) + 1)
    return map
  }, [employees])

  const exitReasonChart = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of employees) {
      if (e.status !== 'Nonaktif' || !e.exitReason) continue
      map.set(e.exitReason, (map.get(e.exitReason) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([department, value]) => ({ department, value }))
  }, [employees])

  const filtered = status === 'Semua' ? employees : employees.filter((e) => e.status === status)

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-1)' }}>
            {initials(e.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{e.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{e.department}</div>
          </div>
        </div>
      ),
      sortValue: (e) => e.name,
    },
    { key: 'position', header: 'Posisi', render: (e) => e.position },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (e) => <Badge tone={employeeStatusTone(e.status)}>{e.status}</Badge>,
      sortValue: (e) => e.status,
    },
    { key: 'exitDate', header: 'Tanggal Keluar', render: (e) => (e.exitDate ? formatDate(e.exitDate) : '—'), sortValue: (e) => e.exitDate ?? '' },
    { key: 'exitReason', header: 'Alasan', render: (e) => e.exitReason ?? '—' },
  ]

  return (
    <AppShell title="Employment Status" subtitle="Status kepegawaian: aktif, cuti panjang, dan nonaktif">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Aktif" value={(counts.get('Aktif') ?? 0).toLocaleString('id-ID')} positive />
        <StatCard label="Cuti Panjang" value={(counts.get('Cuti Panjang') ?? 0).toLocaleString('id-ID')} />
        <StatCard label="Nonaktif" value={(counts.get('Nonaktif') ?? 0).toLocaleString('id-ID')} positive={false} />
      </div>
      <Card className="mt-4" title="Alasan Karyawan Nonaktif">
        <DepartmentBarChart data={exitReasonChart} />
      </Card>
      <Card className="mt-4">
        <div className="mb-4 flex gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <option>Semua</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} />
      </Card>
    </AppShell>
  )
}
