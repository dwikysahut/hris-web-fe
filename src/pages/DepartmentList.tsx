import { useMemo } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatCurrency } from '../lib/utils'
import type { Department } from '../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]

interface DeptRow {
  department: Department
  headcount: number
  avgKpi: number | null
  monthlyCost: number
  head: string
}

export default function DepartmentList() {
  const { employees, kpi, payroll } = useData()

  const latestPeriod = useMemo(() => {
    const periods = Array.from(new Set(kpi.map((k) => k.period))).sort()
    return periods[periods.length - 1]
  }, [kpi])
  const latestPayrollPeriod = useMemo(() => {
    const periods = Array.from(new Set(payroll.map((p) => p.period))).sort()
    return periods[periods.length - 1]
  }, [payroll])

  const rows: DeptRow[] = useMemo(() => {
    return DEPARTMENTS.map((department) => {
      const active = employees.filter((e) => e.department === department && e.status !== 'Nonaktif')
      const ids = active.map((e) => e.id)
      const scores = kpi.filter((k) => k.period === latestPeriod && ids.includes(k.employeeId)).map((k) => k.overallScore)
      const cost = payroll.filter((p) => p.period === latestPayrollPeriod && ids.includes(p.employeeId)).reduce((s, p) => s + p.netPay, 0)
      const lead = active.find((e) => e.level === 'Director') ?? active.find((e) => e.level === 'Head')
      return {
        department,
        headcount: active.length,
        avgKpi: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
        monthlyCost: cost,
        head: lead?.name ?? '—',
      }
    })
  }, [employees, kpi, payroll, latestPeriod, latestPayrollPeriod])

  const headcountChart = rows.map((r) => ({ department: r.department, value: r.headcount }))

  const columns: Column<DeptRow>[] = [
    { key: 'department', header: 'Departemen', render: (r) => <span className="font-medium">{r.department}</span>, sortValue: (r) => r.department },
    { key: 'head', header: 'Kepala Departemen', render: (r) => r.head },
    { key: 'headcount', header: 'Headcount', align: 'right', render: (r) => r.headcount, sortValue: (r) => r.headcount },
    {
      key: 'avgKpi',
      header: 'Rata-rata KPI',
      align: 'right',
      render: (r) => (r.avgKpi !== null ? r.avgKpi : <span className="text-[var(--text-muted)]">—</span>),
      sortValue: (r) => r.avgKpi ?? -1,
    },
    {
      key: 'cost',
      header: 'Biaya Payroll Bulanan',
      align: 'right',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.monthlyCost)}</span>,
      sortValue: (r) => r.monthlyCost,
    },
  ]

  return (
    <AppShell title="Department" subtitle="Ringkasan seluruh departemen: headcount, kinerja, dan biaya">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Departemen" value={DEPARTMENTS.length.toString()} />
        <StatCard label="Departemen Terbesar" value={[...rows].sort((a, b) => b.headcount - a.headcount)[0]?.department ?? '-'} />
        <StatCard label="Total Biaya Payroll" value={formatCurrency(rows.reduce((s, r) => s + r.monthlyCost, 0))} />
      </div>
      <Card className="mt-4" title="Headcount per Departemen">
        <DepartmentBarChart data={headcountChart} />
      </Card>
      <Card className="mt-4">
        <DataTable columns={columns} rows={rows} pageSize={10} />
      </Card>
    </AppShell>
  )
}
