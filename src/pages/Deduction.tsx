import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { formatCurrency, initials } from '../lib/utils'
import type { PayrollRecord } from '../lib/types'

export default function Deduction() {
  const { payroll, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(payroll.map((p) => p.period))).sort(), [payroll])
  const [period, setPeriod] = useState(periods[periods.length - 1])

  const records = useMemo(() => payroll.filter((p) => p.period === period), [payroll, period])
  const totalBpjsKes = records.reduce((s, p) => s + p.bpjsKesehatan, 0)
  const totalBpjsTk = records.reduce((s, p) => s + p.bpjsKetenagakerjaan, 0)
  const totalPph21 = records.reduce((s, p) => s + p.pph21, 0)
  const totalOther = records.reduce((s, p) => s + p.otherDeduction, 0)

  const breakdown = [
    { department: 'BPJS Kesehatan', value: Math.round(totalBpjsKes / 1000) },
    { department: 'BPJS Ketenagakerjaan', value: Math.round(totalBpjsTk / 1000) },
    { department: 'PPh 21', value: Math.round(totalPph21 / 1000) },
    { department: 'Lainnya', value: Math.round(totalOther / 1000) },
  ]

  const columns: Column<PayrollRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (p) => {
        const emp = employeeMap.get(p.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--status-critical)' }}>
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
    { key: 'bpjsKesehatan', header: 'BPJS Kesehatan', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.bpjsKesehatan)}</span>, sortValue: (p) => p.bpjsKesehatan },
    { key: 'bpjsKetenagakerjaan', header: 'BPJS TK', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.bpjsKetenagakerjaan)}</span>, sortValue: (p) => p.bpjsKetenagakerjaan },
    { key: 'pph21', header: 'PPh 21', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.pph21)}</span>, sortValue: (p) => p.pph21 },
    { key: 'otherDeduction', header: 'Lainnya', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.otherDeduction)}</span>, sortValue: (p) => p.otherDeduction },
  ]

  return (
    <AppShell title="Deduction" subtitle="Rincian potongan gaji: BPJS, pajak, dan lainnya">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="BPJS Kesehatan" value={formatCurrency(totalBpjsKes)} />
        <StatCard label="BPJS Ketenagakerjaan" value={formatCurrency(totalBpjsTk)} />
        <StatCard label="PPh 21" value={formatCurrency(totalPph21)} />
        <StatCard label="Potongan Lainnya" value={formatCurrency(totalOther)} />
      </div>
      <Card className="mt-4" title="Komposisi Potongan" subtitle="Dalam ribuan Rupiah">
        <DepartmentBarChart data={breakdown} sortDescending={false} valueLabel="Ribuan Rupiah" />
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
