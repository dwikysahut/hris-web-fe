import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { KpiTrendChart, type KpiTrendPoint } from '../../components/charts/KpiTrendChart'
import { useData } from '../../lib/dataStore'
import { formatMonth } from '../../lib/utils'
import type { KpiRecord } from '../../lib/types'

export default function PerformanceAnalytics() {
  const { kpi, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(kpi.map((k) => k.period))).sort(), [kpi])
  const latestPeriod = periods[periods.length - 1]
  const latestRecords = useMemo(() => kpi.filter((k) => k.period === latestPeriod), [kpi, latestPeriod])

  const avgScore = latestRecords.length ? latestRecords.reduce((s, k) => s + k.overallScore, 0) / latestRecords.length : 0
  const ratingA = latestRecords.filter((k) => k.rating === 'A').length
  const ratingD = latestRecords.filter((k) => k.rating === 'D').length

  const trendData: KpiTrendPoint[] = useMemo(() => {
    return periods.map((p) => {
      const recs = kpi.filter((k) => k.period === p)
      const avg = recs.length ? recs.reduce((s, k) => s + k.overallScore, 0) / recs.length : 0
      return { period: p, label: formatMonth(p).split(' ')[0], avgScore: avg }
    })
  }, [kpi, periods])

  const byDepartment = useMemo(() => {
    const sums = new Map<string, { total: number; count: number }>()
    for (const k of latestRecords) {
      const emp = employeeMap.get(k.employeeId)
      if (!emp) continue
      const bucket = sums.get(emp.department) ?? { total: 0, count: 0 }
      bucket.total += k.overallScore
      bucket.count += 1
      sums.set(emp.department, bucket)
    }
    return Array.from(sums.entries()).map(([label, { total, count }]) => ({ department: label, value: Math.round(total / count) }))
  }, [latestRecords, employeeMap])

  const ratingDistribution = useMemo(() => {
    const order: KpiRecord['rating'][] = ['A', 'B', 'C', 'D']
    const counts = new Map<string, number>()
    for (const k of latestRecords) counts.set(k.rating, (counts.get(k.rating) ?? 0) + 1)
    return order.map((r) => ({ department: `Rating ${r}`, value: counts.get(r) ?? 0 }))
  }, [latestRecords])

  return (
    <AppShell title="Performance Analytics" subtitle="Analisis tren dan distribusi kinerja karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata-rata Skor" value={avgScore.toFixed(1)} deltaLabel={latestPeriod} positive={avgScore >= 75} />
        <StatCard label="Rating A" value={ratingA.toLocaleString('id-ID')} positive />
        <StatCard label="Rating D" value={ratingD.toLocaleString('id-ID')} positive={ratingD === 0} />
        <StatCard label="Total Dinilai" value={latestRecords.length.toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Skor KPI Perusahaan" className="xl:col-span-2">
          <KpiTrendChart data={trendData} />
        </Card>
        <Card title="Distribusi Rating">
          <DepartmentBarChart data={ratingDistribution} sortDescending={false} />
        </Card>
      </div>
      <Card className="mt-4" title="Skor Rata-rata per Departemen" subtitle={latestPeriod}>
        <DepartmentBarChart data={byDepartment} />
      </Card>
    </AppShell>
  )
}
