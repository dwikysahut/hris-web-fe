import { useMemo } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, attendanceTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { initials } from '../lib/utils'
import type { AttendanceRecord } from '../lib/types'

const TODAY = '2026-08-19'

export default function AttendanceMonitoring() {
  const { attendance, employeeMap } = useData()
  const todayRecords = useMemo(() => attendance.filter((a) => a.date === TODAY), [attendance])

  const checkedIn = todayRecords.filter((a) => a.checkIn).length
  const notYet = todayRecords.filter((a) => !a.checkIn && a.status !== 'Cuti' && a.status !== 'Izin' && a.status !== 'Sakit').length
  const late = todayRecords.filter((a) => a.status === 'Terlambat').length
  const onLeave = todayRecords.filter((a) => ['Cuti', 'Izin', 'Sakit'].includes(a.status)).length

  const byDepartment = useMemo(() => {
    const buckets = new Map<string, { hadir: number; total: number }>()
    for (const r of todayRecords) {
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      const bucket = buckets.get(dept) ?? { hadir: 0, total: 0 }
      bucket.total += 1
      if (r.checkIn) bucket.hadir += 1
      buckets.set(dept, bucket)
    }
    return Array.from(buckets.entries()).map(([department, b]) => ({
      department,
      value: b.total ? Math.round((b.hadir / b.total) * 100) : 0,
    }))
  }, [todayRecords, employeeMap])

  const notCheckedInRows = useMemo(
    () => todayRecords.filter((a) => !a.checkIn && !['Cuti', 'Izin', 'Sakit'].includes(a.status)),
    [todayRecords]
  )

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--status-critical)' }}>
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
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={attendanceTone(r.status)}>{r.status}</Badge> },
  ]

  return (
    <AppShell title="Attendance Monitoring" subtitle="Pemantauan kehadiran real-time — 19 Agustus 2026">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sudah Check-in" value={checkedIn.toLocaleString('id-ID')} deltaLabel={`dari ${todayRecords.length}`} positive />
        <StatCard label="Belum Check-in" value={notYet.toLocaleString('id-ID')} positive={notYet === 0} />
        <StatCard label="Terlambat" value={late.toLocaleString('id-ID')} positive={late === 0} />
        <StatCard label="Cuti / Izin / Sakit" value={onLeave.toLocaleString('id-ID')} />
      </div>
      <Card className="mt-4" title="Kehadiran per Departemen" subtitle="Persentase check-in hari ini">
        <DepartmentBarChart data={byDepartment} valueLabel="%" />
      </Card>
      <Card className="mt-4" title="Belum Check-in" subtitle="Karyawan yang belum tercatat masuk hari ini">
        <DataTable columns={columns} rows={notCheckedInRows} pageSize={10} emptyLabel="Semua karyawan sudah check-in" />
      </Card>
    </AppShell>
  )
}
