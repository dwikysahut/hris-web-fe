import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatCurrency, initials } from '../lib/utils'
import type { PayrollRecord } from '../lib/types'

export default function Allowance() {
  const { payroll, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(payroll.map((p) => p.period))).sort(), [payroll])
  const [period, setPeriod] = useState(periods[periods.length - 1])

  const records = useMemo(() => payroll.filter((p) => p.period === period), [payroll, period])
  const totalAllowance = records.reduce((s, p) => s + p.allowance, 0)
  const totalOvertimePay = records.reduce((s, p) => s + p.overtimePay, 0)
  const totalBonus = records.reduce((s, p) => s + p.bonus, 0)

  const byDepartment = useMemo(() => {
    const sums = new Map<string, number>()
    for (const p of records) {
      const dept = employeeMap.get(p.employeeId)?.department
      if (!dept) continue
      sums.set(dept, (sums.get(dept) ?? 0) + p.allowance)
    }
    return Array.from(sums.entries()).map(([department, value]) => ({ department, value: Math.round(value / 1000) }))
  }, [records, employeeMap])

  const columns: Column<PayrollRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (p) => {
        const emp = employeeMap.get(p.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-3)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? p.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </div>
        )
      },
      sortValue: (p) => employeeMap.get(p.employeeId)?.name ?? '',
    },
    { key: 'allowance', header: 'Tunjangan Tetap', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.allowance)}</span>, sortValue: (p) => p.allowance },
    { key: 'overtimePay', header: 'Uang Lembur', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.overtimePay)}</span>, sortValue: (p) => p.overtimePay },
    { key: 'bonus', header: 'Bonus', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.bonus)}</span>, sortValue: (p) => p.bonus },
  ]

  return (
    <AppShell title="Allowance" subtitle="Rincian tunjangan, uang lembur, dan bonus karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Tunjangan Tetap" value={formatCurrency(totalAllowance)} />
        <StatCard label="Total Uang Lembur" value={formatCurrency(totalOvertimePay)} />
        <StatCard label="Total Bonus" value={formatCurrency(totalBonus)} />
      </div>
      <Card className="mt-4" title="Tunjangan per Departemen" subtitle="Dalam ribuan Rupiah">
        <DepartmentBarChart data={byDepartment} valueLabel="Ribuan Rupiah" />
      </Card>
      <Card className="mt-4">
        <div className="mb-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} rows={records} pageSize={10} />
      </Card>
    </AppShell>
  )
}
