import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, attendanceTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { AttendanceBreakdownChart, type BreakdownDatum } from '../components/charts/AttendanceBreakdownChart'
import { useData } from '../lib/dataStore'
import { exportAttendance } from '../lib/excel'
import { initials } from '../lib/utils'
import type { AttendanceRecord, Department } from '../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]
const STATUSES = ['Hadir', 'WFH', 'Terlambat', 'Izin', 'Sakit', 'Cuti', 'Alpha']

const AVAILABLE_DATES = ['2026-08-19', '2026-08-18', '2026-08-17', '2026-08-14', '2026-08-13']

export default function Attendance() {
  const { attendance, employeeMap } = useData()
  const [date, setDate] = useState(AVAILABLE_DATES[0])
  const [department, setDepartment] = useState('Semua')
  const [status, setStatus] = useState('Semua')
  const [query, setQuery] = useState('')

  const dayRecords = useMemo(() => attendance.filter((a) => a.date === date), [attendance, date])

  const filtered = useMemo(() => {
    return dayRecords.filter((r) => {
      const emp = employeeMap.get(r.employeeId)
      const matchDept = department === 'Semua' || emp?.department === department
      const matchStatus = status === 'Semua' || r.status === status
      const matchQuery = !query || emp?.name.toLowerCase().includes(query.toLowerCase())
      return matchDept && matchStatus && matchQuery
    })
  }, [dayRecords, department, status, query, employeeMap])

  const summary = useMemo(() => {
    const total = dayRecords.length
    const hadir = dayRecords.filter((r) => r.status === 'Hadir' || r.status === 'WFH').length
    const terlambat = dayRecords.filter((r) => r.status === 'Terlambat').length
    const absen = dayRecords.filter((r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti').length
    const alpha = dayRecords.filter((r) => r.status === 'Alpha').length
    return { total, hadir, terlambat, absen, alpha }
  }, [dayRecords])

  const breakdownData: BreakdownDatum[] = useMemo(() => {
    const currentMonth = date.slice(0, 7)
    const monthRecords = attendance.filter((r) => r.date.startsWith(currentMonth))
    const byDept = new Map<string, Record<string, number>>()
    for (const d of DEPARTMENTS) byDept.set(d, { Hadir: 0, WFH: 0, Terlambat: 0, Izin: 0, Sakit: 0, Cuti: 0, Alpha: 0, total: 0 })
    for (const r of monthRecords) {
      const emp = employeeMap.get(r.employeeId)
      if (!emp) continue
      const bucket = byDept.get(emp.department)
      if (!bucket) continue
      bucket[r.status] = (bucket[r.status] ?? 0) + 1
      bucket.total += 1
    }
    return DEPARTMENTS.map((department) => {
      const b = byDept.get(department)!
      const total = b.total || 1
      return {
        department,
        Hadir: (b.Hadir / total) * 100,
        WFH: (b.WFH / total) * 100,
        Terlambat: (b.Terlambat / total) * 100,
        Izin: (b.Izin / total) * 100,
        Sakit: (b.Sakit / total) * 100,
        Cuti: (b.Cuti / total) * 100,
        Alpha: (b.Alpha / total) * 100,
      }
    })
  }, [attendance, date, employeeMap])

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--series-7)' }}
            >
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
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={attendanceTone(r.status)}>{r.status}</Badge>,
      sortValue: (r) => r.status,
    },
    { key: 'checkIn', header: 'Jam Masuk', align: 'center', render: (r) => r.checkIn ?? '—' },
    { key: 'checkOut', header: 'Jam Keluar', align: 'center', render: (r) => r.checkOut ?? '—' },
    {
      key: 'workHours',
      header: 'Jam Kerja',
      align: 'right',
      render: (r) => <span className="tabular-nums">{r.workHours.toFixed(1)}</span>,
      sortValue: (r) => r.workHours,
    },
  ]

  return (
    <AppShell title="Absensi" subtitle="Pantau kehadiran karyawan harian dan tren bulanan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hadir" value={summary.hadir.toLocaleString('id-ID')} deltaLabel={`dari ${summary.total} karyawan`} />
        <StatCard label="Terlambat" value={summary.terlambat.toLocaleString('id-ID')} positive={false} deltaLabel="perlu ditinjau" />
        <StatCard label="Izin / Sakit / Cuti" value={summary.absen.toLocaleString('id-ID')} deltaLabel="tidak masuk kerja" />
        <StatCard label="Alpha" value={summary.alpha.toLocaleString('id-ID')} positive={false} deltaLabel="tanpa keterangan" />
      </div>

      <Card className="mt-4" title="Komposisi Kehadiran per Departemen" subtitle={`Bulan berjalan — ${date.slice(0, 7)}`}>
        <AttendanceBreakdownChart data={breakdownData} />
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {AVAILABLE_DATES.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama karyawan..."
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <button
            onClick={() => exportAttendance(filtered, employeeMap)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            Export Excel
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada catatan absensi" />
      </Card>
    </AppShell>
  )
}
