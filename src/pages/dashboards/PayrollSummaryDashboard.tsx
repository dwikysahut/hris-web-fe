import { useMemo, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'
import { formatCurrency, formatCurrencyCompact } from '../../lib/utils'

export default function PayrollSummaryDashboard() {
  const { payroll, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(payroll.map((p) => p.period))).sort(), [payroll])
  const [period] = useState(periods[periods.length - 1])

  const periodRecords = useMemo(() => payroll.filter((p) => p.period === period), [payroll, period])
  const totalNet = periodRecords.reduce((s, p) => s + p.netPay, 0)
  const totalGross = periodRecords.reduce((s, p) => s + p.grossPay, 0)
  const avgNet = periodRecords.length ? totalNet / periodRecords.length : 0

  const byDepartment = useMemo(() => {
    const sums = new Map<string, number>()
    for (const p of periodRecords) {
      const dept = employeeMap.get(p.employeeId)?.department
      if (!dept) continue
      sums.set(dept, (sums.get(dept) ?? 0) + p.netPay)
    }
    return Array.from(sums.entries()).map(([department, value]) => ({ department, value: Math.round(value / 1_000_000) }))
  }, [periodRecords, employeeMap])

  const trend = useMemo(
    () =>
      periods.map((p) => ({
        label: p,
        value: Math.round(payroll.filter((x) => x.period === p).reduce((s, x) => s + x.netPay, 0) / 1_000_000),
      })),
    [payroll, periods]
  )

  return (
    <AppShell title="Payroll Summary" subtitle={`Executive Dashboard — ringkasan biaya penggajian periode ${period}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Gaji Kotor" value={formatCurrencyCompact(totalGross)} />
        <StatCard label="Total Gaji Bersih" value={formatCurrencyCompact(totalNet)} />
        <StatCard label="Rata-rata Gaji Bersih" value={formatCurrency(avgNet)} />
        <StatCard label="Karyawan Dibayar" value={periodRecords.length.toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Biaya Payroll" subtitle="Dalam juta Rupiah — gaji bersih" className="xl:col-span-2">
          <TrendLineChart data={trend} name="Juta Rupiah" />
        </Card>
        <Card title="Biaya per Departemen" subtitle="Dalam juta Rupiah">
          <DepartmentBarChart data={byDepartment} valueLabel="Juta Rupiah" />
        </Card>
      </div>
    </AppShell>
  )
}
