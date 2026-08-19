import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'

export default function HeadcountDashboard() {
  const { employees } = useData()
  const active = useMemo(() => employees.filter((e) => e.status !== 'Nonaktif'), [employees])

  const newHires2026 = active.filter((e) => e.joinDate.startsWith('2026')).length
  const avgTenureYears = useMemo(() => {
    const today = new Date('2026-08-19')
    const years = active.map((e) => (today.getTime() - new Date(e.joinDate).getTime()) / (365.25 * 86400000))
    return years.length ? years.reduce((s, v) => s + v, 0) / years.length : 0
  }, [active])

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of active) counts.set(e.department, (counts.get(e.department) ?? 0) + 1)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [active])

  const growthTrend = useMemo(() => {
    const months: string[] = []
    const base = new Date('2025-09-01')
    for (let i = 0; i < 12; i++) {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      months.push(d.toISOString().slice(0, 7))
    }
    let cumulative = active.filter((e) => e.joinDate < months[0]).length
    return months.map((m) => {
      const hiresInMonth = active.filter((e) => e.joinDate.slice(0, 7) === m).length
      cumulative += hiresInMonth
      return { label: new Date(m + '-01').toLocaleDateString('id-ID', { month: 'short' }), value: cumulative }
    })
  }, [active])

  return (
    <AppShell title="Headcount" subtitle="Executive Dashboard — pertumbuhan dan distribusi jumlah karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Headcount" value={active.length.toLocaleString('id-ID')} delta={`${newHires2026} baru`} deltaLabel="2026" positive />
        <StatCard label="Karyawan Baru 2026" value={newHires2026.toLocaleString('id-ID')} />
        <StatCard label="Rata-rata Masa Kerja" value={`${avgTenureYears.toFixed(1)} tahun`} />
        <StatCard label="Departemen Terbesar" value={[...byDepartment].sort((a, b) => b.value - a.value)[0]?.department ?? '-'} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Pertumbuhan Headcount" subtitle="Kumulatif 12 bulan terakhir" className="xl:col-span-2">
          <TrendLineChart data={growthTrend} name="Headcount" />
        </Card>
        <Card title="Headcount per Departemen">
          <DepartmentBarChart data={byDepartment} />
        </Card>
      </div>
    </AppShell>
  )
}
