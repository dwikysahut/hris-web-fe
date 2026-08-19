import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { AttendanceTrendChart, type TrendPoint } from '../../components/charts/AttendanceTrendChart'
import { AttendanceBreakdownChart, type BreakdownDatum } from '../../components/charts/AttendanceBreakdownChart'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { useData } from '../../lib/dataStore'
import type { AttendanceStatus, Department } from '../../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]

export default function AttendanceAnalytics() {
  const { attendance, employeeMap } = useData()

  const overallRate = useMemo(() => {
    const hadir = attendance.filter((a) => a.status === 'Hadir' || a.status === 'WFH').length
    return attendance.length ? (hadir / attendance.length) * 100 : 0
  }, [attendance])

  const punctualityRate = useMemo(() => {
    const total = attendance.filter((a) => a.status === 'Hadir' || a.status === 'WFH' || a.status === 'Terlambat').length
    const onTime = attendance.filter((a) => a.status === 'Hadir' || a.status === 'WFH').length
    return total ? (onTime / total) * 100 : 0
  }, [attendance])

  const avgWorkHours = useMemo(() => {
    const worked = attendance.filter((a) => a.workHours > 0)
    return worked.length ? worked.reduce((s, a) => s + a.workHours, 0) / worked.length : 0
  }, [attendance])

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

  const breakdownData: BreakdownDatum[] = useMemo(() => {
    const currentMonth = '2026-08'
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
  }, [attendance, employeeMap])

  const avgHoursByDept = useMemo(() => {
    const buckets = new Map<string, { total: number; count: number }>()
    for (const r of attendance) {
      if (r.workHours <= 0) continue
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      const bucket = buckets.get(dept) ?? { total: 0, count: 0 }
      bucket.total += r.workHours
      bucket.count += 1
      buckets.set(dept, bucket)
    }
    return Array.from(buckets.entries()).map(([department, b]) => ({ department, value: Number((b.total / b.count).toFixed(1)) }))
  }, [attendance, employeeMap])

  const worstStatus: AttendanceStatus = 'Alpha'

  return (
    <AppShell title="Attendance Analytics" subtitle="Analisis mendalam pola kehadiran karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tingkat Kehadiran Keseluruhan" value={`${overallRate.toFixed(1)}%`} positive={overallRate >= 85} />
        <StatCard label="Tingkat Ketepatan Waktu" value={`${punctualityRate.toFixed(1)}%`} positive={punctualityRate >= 90} />
        <StatCard label="Rata-rata Jam Kerja" value={`${avgWorkHours.toFixed(1)} jam`} />
        <StatCard label={`Total ${worstStatus}`} value={attendance.filter((a) => a.status === worstStatus).length.toLocaleString('id-ID')} positive={false} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Kehadiran" subtitle="30 hari kerja terakhir" className="xl:col-span-2">
          <AttendanceTrendChart data={trendData} />
        </Card>
        <Card title="Rata-rata Jam Kerja per Departemen">
          <DepartmentBarChart data={avgHoursByDept} valueLabel="Jam" />
        </Card>
      </div>
      <Card className="mt-4" title="Komposisi Kehadiran per Departemen" subtitle="Bulan berjalan — 2026-08">
        <AttendanceBreakdownChart data={breakdownData} />
      </Card>
    </AppShell>
  )
}
