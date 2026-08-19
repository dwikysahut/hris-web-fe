import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, attendanceTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { AttendanceRecord, AttendanceStatus } from '../lib/types'

const ABSENCE_STATUSES: AttendanceStatus[] = ['Izin', 'Sakit', 'Alpha', 'Cuti']

export default function Absence() {
  const { attendance, employeeMap } = useData()
  const [status, setStatus] = useState<'Semua' | AttendanceStatus>('Semua')

  const absenceRecords = useMemo(() => attendance.filter((a) => ABSENCE_STATUSES.includes(a.status)), [attendance])
  const alphaCount = absenceRecords.filter((a) => a.status === 'Alpha').length
  const sakitCount = absenceRecords.filter((a) => a.status === 'Sakit').length
  const izinCount = absenceRecords.filter((a) => a.status === 'Izin').length

  const byType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of absenceRecords) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [absenceRecords])

  const filtered = status === 'Semua' ? absenceRecords : absenceRecords.filter((a) => a.status === status)

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-2)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? r.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </div>
        )
      },
      sortValue: (r) => employeeMap.get(r.employeeId)?.name ?? '',
    },
    { key: 'date', header: 'Tanggal', render: (r) => formatDate(r.date), sortValue: (r) => r.date },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={attendanceTone(r.status)}>{r.status}</Badge>, sortValue: (r) => r.status },
  ]

  return (
    <AppShell title="Absence" subtitle="Rekap ketidakhadiran karyawan: izin, sakit, alpha, dan cuti">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Alpha" value={alphaCount.toLocaleString('id-ID')} positive={alphaCount === 0} />
        <StatCard label="Sakit" value={sakitCount.toLocaleString('id-ID')} />
        <StatCard label="Izin" value={izinCount.toLocaleString('id-ID')} />
      </div>
      <Card className="mt-4" title="Distribusi Jenis Ketidakhadiran">
        <DepartmentBarChart data={byType} />
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
            {ABSENCE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} />
      </Card>
    </AppShell>
  )
}
