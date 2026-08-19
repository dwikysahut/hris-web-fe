import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, attendanceTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { AttendanceRecord } from '../lib/types'

export default function LateEarlyLeave() {
  const { attendance, employeeMap } = useData()
  const [query, setQuery] = useState('')

  const lateRecords = useMemo(() => attendance.filter((a) => a.status === 'Terlambat'), [attendance])
  const thisMonth = lateRecords.filter((r) => r.date.startsWith('2026-08')).length
  const thisWeek = lateRecords.filter((r) => r.date >= '2026-08-13').length

  const topOffenders = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of lateRecords) counts.set(r.employeeId, (counts.get(r.employeeId) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([employeeId, count]) => ({ department: employeeMap.get(employeeId)?.name ?? employeeId, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [lateRecords, employeeMap])

  const filtered = useMemo(
    () => lateRecords.filter((r) => !query || employeeMap.get(r.employeeId)?.name.toLowerCase().includes(query.toLowerCase())),
    [lateRecords, query, employeeMap]
  )

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-4)' }}>
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
    { key: 'checkIn', header: 'Jam Masuk', align: 'center', render: (r) => <Badge tone={attendanceTone('Terlambat')}>{r.checkIn}</Badge> },
    { key: 'checkOut', header: 'Jam Keluar', align: 'center', render: (r) => r.checkOut ?? '—' },
  ]

  return (
    <AppShell title="Late / Early Leave" subtitle="Catatan keterlambatan karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Keterlambatan" value={lateRecords.length.toLocaleString('id-ID')} positive={false} />
        <StatCard label="Bulan Ini" value={thisMonth.toLocaleString('id-ID')} positive={false} />
        <StatCard label="7 Hari Terakhir" value={thisWeek.toLocaleString('id-ID')} positive={false} />
      </div>
      <Card className="mt-4" title="Karyawan Paling Sering Terlambat">
        <DepartmentBarChart data={topOffenders} valueLabel="Kali" />
      </Card>
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
