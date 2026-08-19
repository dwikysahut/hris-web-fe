import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatCurrency, initials } from '../lib/utils'
import type { Employee } from '../lib/types'

const BAND_ORDER: Employee['salaryBand'][] = ['Band 1', 'Band 2', 'Band 3', 'Band 4', 'Band 5']

export default function Salary() {
  const { employees, payroll } = useData()
  const [query, setQuery] = useState('')

  const latestPeriod = useMemo(() => {
    const periods = Array.from(new Set(payroll.map((p) => p.period))).sort()
    return periods[periods.length - 1]
  }, [payroll])

  const basicByEmployee = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of payroll) {
      if (p.period !== latestPeriod) continue
      map.set(p.employeeId, p.basicSalary)
    }
    return map
  }, [payroll, latestPeriod])

  const byBand = useMemo(() => {
    return BAND_ORDER.map((band) => {
      const salaries = employees.filter((e) => e.salaryBand === band && e.status !== 'Nonaktif').map((e) => basicByEmployee.get(e.id) ?? 0).filter((v) => v > 0)
      return { department: band, value: salaries.length ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length / 1000) : 0 }
    })
  }, [employees, basicByEmployee])

  const rows = useMemo(() => {
    return employees
      .filter((e) => e.status !== 'Nonaktif')
      .map((e) => ({ employee: e, basicSalary: basicByEmployee.get(e.id) ?? 0 }))
      .filter((r) => r.basicSalary > 0 && (!query || r.employee.name.toLowerCase().includes(query.toLowerCase())))
  }, [employees, basicByEmployee, query])

  const allSalaries = rows.map((r) => r.basicSalary)
  const avgSalary = allSalaries.length ? allSalaries.reduce((s, v) => s + v, 0) / allSalaries.length : 0

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-6)' }}>
            {initials(r.employee.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{r.employee.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{r.employee.position}</div>
          </div>
        </div>
      ),
      sortValue: (r) => r.employee.name,
    },
    { key: 'level', header: 'Level', render: (r) => r.employee.level },
    { key: 'band', header: 'Salary Band', align: 'center', render: (r) => <Badge tone="neutral">{r.employee.salaryBand}</Badge>, sortValue: (r) => r.employee.salaryBand },
    {
      key: 'basicSalary',
      header: 'Gaji Pokok',
      align: 'right',
      render: (r) => <span className="tabular-nums font-semibold">{formatCurrency(r.basicSalary)}</span>,
      sortValue: (r) => r.basicSalary,
    },
  ]

  return (
    <AppShell title="Salary" subtitle={`Struktur gaji pokok karyawan — periode ${latestPeriod}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Rata-rata Gaji Pokok" value={formatCurrency(avgSalary)} />
        <StatCard label="Gaji Tertinggi" value={formatCurrency(Math.max(...allSalaries, 0))} />
        <StatCard label="Gaji Terendah" value={formatCurrency(Math.min(...allSalaries.filter((v) => v > 0), 0))} />
      </div>
      <Card className="mt-4" title="Rata-rata Gaji Pokok per Salary Band" subtitle="Dalam ribuan Rupiah">
        <DepartmentBarChart data={byBand} sortDescending={false} valueLabel="Ribuan Rupiah" />
      </Card>
      <Card className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama karyawan..."
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm sm:max-w-xs"
          style={{ borderColor: 'var(--border)' }}
        />
        <DataTable columns={columns} rows={rows} pageSize={10} />
      </Card>
    </AppShell>
  )
}
