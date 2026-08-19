import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { TrendLineChart } from '../../components/charts/TrendLineChart'
import { useData } from '../../lib/dataStore'
import { formatCurrency, formatCurrencyCompact } from '../../lib/utils'

export default function PayrollAnalytics() {
  const { payroll, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(payroll.map((p) => p.period))).sort(), [payroll])
  const latestPeriod = periods[periods.length - 1]

  const latestRecords = useMemo(() => payroll.filter((p) => p.period === latestPeriod), [payroll, latestPeriod])
  const totalNet = latestRecords.reduce((s, p) => s + p.netPay, 0)
  const totalGross = latestRecords.reduce((s, p) => s + p.grossPay, 0)
  const deductionRatio = totalGross ? ((totalGross - totalNet) / totalGross) * 100 : 0
  const overtimeCost = latestRecords.reduce((s, p) => s + p.overtimePay, 0)

  const netTrend = useMemo(
    () =>
      periods.map((p) => ({
        label: p,
        value: Math.round(payroll.filter((x) => x.period === p).reduce((s, x) => s + x.netPay, 0) / 1_000_000),
      })),
    [payroll, periods]
  )

  const grossVsNet = useMemo(() => {
    return [
      { department: 'Gaji Kotor', value: Math.round(totalGross / 1_000_000) },
      { department: 'Gaji Bersih', value: Math.round(totalNet / 1_000_000) },
    ]
  }, [totalGross, totalNet])

  const byDepartment = useMemo(() => {
    const sums = new Map<string, number>()
    for (const p of latestRecords) {
      const dept = employeeMap.get(p.employeeId)?.department
      if (!dept) continue
      sums.set(dept, (sums.get(dept) ?? 0) + p.netPay)
    }
    return Array.from(sums.entries()).map(([department, value]) => ({ department, value: Math.round(value / 1_000_000) }))
  }, [latestRecords, employeeMap])

  return (
    <AppShell title="Payroll Analytics" subtitle="Analisis mendalam biaya penggajian perusahaan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Biaya Payroll" value={formatCurrencyCompact(totalNet)} deltaLabel={latestPeriod} />
        <StatCard label="Rasio Potongan" value={`${deductionRatio.toFixed(1)}%`} deltaLabel="dari gaji kotor" />
        <StatCard label="Biaya Lembur" value={formatCurrency(overtimeCost)} />
        <StatCard label="Karyawan Dibayar" value={latestRecords.length.toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Biaya Payroll" subtitle="Dalam juta Rupiah — gaji bersih" className="xl:col-span-2">
          <TrendLineChart data={netTrend} name="Juta Rupiah" />
        </Card>
        <Card title="Gaji Kotor vs Bersih" subtitle="Dalam juta Rupiah">
          <DepartmentBarChart data={grossVsNet} sortDescending={false} valueLabel="Juta Rupiah" />
        </Card>
      </div>
      <Card className="mt-4" title="Biaya per Departemen" subtitle="Dalam juta Rupiah">
        <DepartmentBarChart data={byDepartment} valueLabel="Juta Rupiah" />
      </Card>
    </AppShell>
  )
}
