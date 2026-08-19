import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'

export default function TurnoverDashboard() {
  const { employees } = useData()
  const exited = useMemo(() => employees.filter((e) => e.status === 'Nonaktif' && e.exitDate), [employees])
  const active = useMemo(() => employees.filter((e) => e.status !== 'Nonaktif'), [employees])
  const turnoverRate = employees.length ? (exited.length / employees.length) * 100 : 0
  const resignCount = exited.filter((e) => e.exitReason === 'Resign').length

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of exited) counts.set(e.department, (counts.get(e.department) ?? 0) + 1)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [exited])

  const byReason = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of exited) {
      const reason = e.exitReason ?? 'Lainnya'
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [exited])

  const trend = useMemo(() => {
    const months: string[] = []
    const base = new Date('2025-09-01')
    for (let i = 0; i < 12; i++) {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      months.push(d.toISOString().slice(0, 7))
    }
    return months.map((m) => ({
      label: new Date(m + '-01').toLocaleDateString('id-ID', { month: 'short' }),
      value: exited.filter((e) => e.exitDate?.slice(0, 7) === m).length,
    }))
  }, [exited])

  return (
    <AppShell title="Turnover" subtitle="Executive Dashboard — analisis karyawan keluar dan tingkat turnover">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Keluar (12 bln)" value={exited.length.toLocaleString('id-ID')} positive={false} />
        <StatCard label="Turnover Rate" value={`${turnoverRate.toFixed(1)}%`} positive={turnoverRate < 5} deltaLabel="dari total karyawan" />
        <StatCard label="Resign Sukarela" value={resignCount.toLocaleString('id-ID')} deltaLabel={`dari ${exited.length} keluar`} />
        <StatCard label="Karyawan Aktif Saat Ini" value={active.length.toLocaleString('id-ID')} positive />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Keluar Karyawan" subtitle="12 bulan terakhir" className="xl:col-span-2">
          <TrendLineChart data={trend} name="Karyawan Keluar" color="var(--status-critical)" />
        </Card>
        <Card title="Keluar per Departemen">
          <DepartmentBarChart data={byDepartment} />
        </Card>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Alasan Keluar">
          <DepartmentBarChart data={byReason} sortDescending={false} />
        </Card>
      </div>
    </AppShell>
  )
}
