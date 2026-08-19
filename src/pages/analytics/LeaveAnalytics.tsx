import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'

export default function LeaveAnalytics() {
  const { leaveRequests, employeeMap } = useData()
  const approved = useMemo(() => leaveRequests.filter((r) => r.status === 'Disetujui'), [leaveRequests])

  const approvalRate = leaveRequests.length ? (approved.length / leaveRequests.length) * 100 : 0
  const avgDuration = approved.length ? approved.reduce((s, r) => s + r.days, 0) / approved.length : 0
  const rejectedCount = leaveRequests.filter((r) => r.status === 'Ditolak').length

  const byType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) counts.set(r.type, (counts.get(r.type) ?? 0) + r.days)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved])

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) {
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      counts.set(dept, (counts.get(dept) ?? 0) + r.days)
    }
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved, employeeMap])

  const trend = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const r of approved) {
      const month = r.startDate.slice(0, 7)
      byMonth.set(month, (byMonth.get(month) ?? 0) + r.days)
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([m, days]) => ({ label: new Date(m + '-01').toLocaleDateString('id-ID', { month: 'short' }), value: days }))
  }, [approved])

  return (
    <AppShell title="Leave Analytics" subtitle="Analisis pola pengajuan dan penggunaan cuti">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tingkat Persetujuan" value={`${approvalRate.toFixed(1)}%`} positive={approvalRate >= 80} />
        <StatCard label="Rata-rata Durasi" value={`${avgDuration.toFixed(1)} hari`} />
        <StatCard label="Total Ditolak" value={rejectedCount.toLocaleString('id-ID')} positive={rejectedCount === 0} />
        <StatCard label="Total Hari Disetujui" value={approved.reduce((s, r) => s + r.days, 0).toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Hari Cuti" subtitle="Berdasarkan bulan mulai cuti" className="xl:col-span-2">
          <TrendLineChart data={trend} name="Hari Cuti" />
        </Card>
        <Card title="Hari Cuti per Jenis">
          <DepartmentBarChart data={byType} valueLabel="Hari" />
        </Card>
      </div>
      <Card className="mt-4" title="Hari Cuti per Departemen">
        <DepartmentBarChart data={byDepartment} valueLabel="Hari" />
      </Card>
    </AppShell>
  )
}
