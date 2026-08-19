import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'

export default function PeopleAnalytics() {
  const { employees } = useData()
  const active = useMemo(() => employees.filter((e) => e.status !== 'Nonaktif'), [employees])

  const genderSplit = useMemo(() => {
    const male = active.filter((e) => e.gender === 'L').length
    const female = active.filter((e) => e.gender === 'P').length
    return [
      { department: 'Laki-laki', value: male },
      { department: 'Perempuan', value: female },
    ]
  }, [active])

  const levelSplit = useMemo(() => {
    const order = ['Staff', 'Supervisor', 'Manager', 'Head', 'Director']
    const counts = new Map<string, number>()
    for (const e of active) counts.set(e.level, (counts.get(e.level) ?? 0) + 1)
    return order.filter((l) => counts.has(l)).map((department) => ({ department, value: counts.get(department) ?? 0 }))
  }, [active])

  const locationSplit = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of active) counts.set(e.location, (counts.get(e.location) ?? 0) + 1)
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
      cumulative += active.filter((e) => e.joinDate.slice(0, 7) === m).length
      return { label: new Date(m + '-01').toLocaleDateString('id-ID', { month: 'short' }), value: cumulative }
    })
  }, [active])

  const genderRatio = active.length ? (genderSplit[0].value / active.length) * 100 : 0

  return (
    <AppShell title="People Analytics" subtitle="Analisis komposisi dan pertumbuhan populasi karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Karyawan Aktif" value={active.length.toLocaleString('id-ID')} />
        <StatCard label="Rasio Laki-laki" value={`${genderRatio.toFixed(1)}%`} />
        <StatCard label="Lokasi Terbanyak" value={[...locationSplit].sort((a, b) => b.value - a.value)[0]?.department ?? '-'} />
        <StatCard label="Level Terbanyak" value={[...levelSplit].sort((a, b) => b.value - a.value)[0]?.department ?? '-'} />
      </div>
      <Card className="mt-4" title="Pertumbuhan Headcount" subtitle="Kumulatif 12 bulan terakhir">
        <TrendLineChart data={growthTrend} name="Headcount" />
      </Card>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Distribusi Gender">
          <DepartmentBarChart data={genderSplit} />
        </Card>
        <Card title="Distribusi Level">
          <DepartmentBarChart data={levelSplit} sortDescending={false} />
        </Card>
        <Card title="Distribusi Lokasi">
          <DepartmentBarChart data={locationSplit} />
        </Card>
      </div>
    </AppShell>
  )
}
