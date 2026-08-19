import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { AttendanceTrendChart, type TrendPoint } from '../../components/charts/AttendanceTrendChart'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { useData } from '../../lib/dataStore'

const TODAY = '2026-08-19'

export default function AttendanceDashboard() {
  const { attendance, employeeMap } = useData()

  const todayRecords = useMemo(() => attendance.filter((a) => a.date === TODAY), [attendance])
  const hadir = todayRecords.filter((a) => a.status === 'Hadir' || a.status === 'WFH').length
  const terlambat = todayRecords.filter((a) => a.status === 'Terlambat').length
  const absen = todayRecords.filter((a) => ['Izin', 'Sakit', 'Cuti', 'Alpha'].includes(a.status)).length
  const rate = todayRecords.length ? (hadir / todayRecords.length) * 100 : 0

  const trendData: TrendPoint[] = useMemo(() => {
    const byDate = new Map<string, { hadir: number; terlambat: number; total: number }>()
    for (const r of attendance) {
      const bucket = byDate.get(r.date) ?? { hadir: 0, terlambat: 0, total: 0 }
      bucket.total += 1
      if (r.status === 'Hadir' || r.status === 'WFH') bucket.hadir += 1
      if (r.status === 'Terlambat') bucket.terlambat += 1
      byDate.set(r.date, bucket)
    }
    const dates = Array.from(byDate.keys()).sort().slice(-30)
    return dates.map((date) => {
      const b = byDate.get(date)!
      return {
        date,
        label: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        hadirPct: b.total ? (b.hadir / b.total) * 100 : 0,
        terlambatPct: b.total ? (b.terlambat / b.total) * 100 : 0,
      }
    })
  }, [attendance])

  const rateByDepartment = useMemo(() => {
    const buckets = new Map<string, { hadir: number; total: number }>()
    for (const r of todayRecords) {
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      const bucket = buckets.get(dept) ?? { hadir: 0, total: 0 }
      bucket.total += 1
      if (r.status === 'Hadir' || r.status === 'WFH') bucket.hadir += 1
      buckets.set(dept, bucket)
    }
    return Array.from(buckets.entries()).map(([department, b]) => ({
      department,
      value: b.total ? Math.round((b.hadir / b.total) * 100) : 0,
    }))
  }, [todayRecords, employeeMap])

  return (
    <AppShell title="Attendance" subtitle="Executive Dashboard — ringkasan kehadiran perusahaan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tingkat Kehadiran" value={`${rate.toFixed(1)}%`} positive={rate >= 85} />
        <StatCard label="Hadir Hari Ini" value={hadir.toLocaleString('id-ID')} deltaLabel={`dari ${todayRecords.length}`} />
        <StatCard label="Terlambat" value={terlambat.toLocaleString('id-ID')} positive={false} />
        <StatCard label="Tidak Masuk" value={absen.toLocaleString('id-ID')} positive={false} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Kehadiran" subtitle="30 hari kerja terakhir" className="xl:col-span-2">
          <AttendanceTrendChart data={trendData} />
        </Card>
        <Card title="Tingkat Kehadiran per Departemen" subtitle="Hari ini (%)">
          <DepartmentBarChart data={rateByDepartment} valueLabel="%" />
        </Card>
      </div>
    </AppShell>
  )
}
