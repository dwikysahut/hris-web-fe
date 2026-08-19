import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { useData } from '../lib/dataStore'
import { exportEmployees } from '../lib/excel'

type Dataset = 'Karyawan' | 'Absensi' | 'KPI' | 'Payroll'
type Metric = 'Jumlah' | 'Rata-rata'

const DIMENSIONS_BY_DATASET: Record<Dataset, string[]> = {
  Karyawan: ['Departemen', 'Level', 'Status', 'Lokasi', 'Jenis Kelamin'],
  Absensi: ['Status', 'Departemen'],
  KPI: ['Departemen', 'Rating'],
  Payroll: ['Departemen', 'Status'],
}

interface ReportRow {
  dimension: string
  value: number
}

export default function CustomReports() {
  const { employees, attendance, kpi, payroll, employeeMap } = useData()
  const [dataset, setDataset] = useState<Dataset>('Karyawan')
  const [dimension, setDimension] = useState('Departemen')
  const [metric, setMetric] = useState<Metric>('Jumlah')

  function dimensionKey(dim: string, employeeId: string, raw: Record<string, unknown>): string {
    if (dim === 'Departemen') return employeeMap.get(employeeId)?.department ?? '-'
    if (dim === 'Level') return employeeMap.get(employeeId)?.level ?? '-'
    if (dim === 'Status') return String(raw.status ?? employeeMap.get(employeeId)?.status ?? '-')
    if (dim === 'Lokasi') return employeeMap.get(employeeId)?.location ?? '-'
    if (dim === 'Jenis Kelamin') return employeeMap.get(employeeId)?.gender === 'L' ? 'Laki-laki' : 'Perempuan'
    if (dim === 'Rating') return String(raw.rating ?? '-')
    return '-'
  }

  const reportRows: ReportRow[] = useMemo(() => {
    const groups = new Map<string, number[]>()

    function push(key: string, value: number) {
      const list = groups.get(key) ?? []
      list.push(value)
      groups.set(key, list)
    }

    if (dataset === 'Karyawan') {
      for (const e of employees) {
        const key = dimensionKey(dimension, e.id, e as unknown as Record<string, unknown>)
        push(key, 1)
      }
    } else if (dataset === 'Absensi') {
      for (const a of attendance) {
        const key = dimensionKey(dimension, a.employeeId, a as unknown as Record<string, unknown>)
        push(key, a.workHours)
      }
    } else if (dataset === 'KPI') {
      const latestPeriod = Array.from(new Set(kpi.map((k) => k.period))).sort().slice(-1)[0]
      for (const k of kpi.filter((x) => x.period === latestPeriod)) {
        const key = dimensionKey(dimension, k.employeeId, k as unknown as Record<string, unknown>)
        push(key, k.overallScore)
      }
    } else if (dataset === 'Payroll') {
      const latestPeriod = Array.from(new Set(payroll.map((p) => p.period))).sort().slice(-1)[0]
      for (const p of payroll.filter((x) => x.period === latestPeriod)) {
        const key = dimensionKey(dimension, p.employeeId, p as unknown as Record<string, unknown>)
        push(key, p.netPay)
      }
    }

    return Array.from(groups.entries()).map(([key, values]) => ({
      dimension: key,
      value: metric === 'Jumlah' ? values.length : Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    }))
  }, [dataset, dimension, metric, employees, attendance, kpi, payroll, employeeMap])

  const chartData = reportRows.map((r) => ({ department: r.dimension, value: r.value }))

  const columns: Column<ReportRow>[] = [
    { key: 'dimension', header: dimension, render: (r) => <span className="font-medium">{r.dimension}</span>, sortValue: (r) => r.dimension },
    {
      key: 'value',
      header: metric === 'Jumlah' ? 'Jumlah' : 'Rata-rata',
      align: 'right',
      render: (r) => <span className="tabular-nums font-semibold">{r.value.toLocaleString('id-ID')}</span>,
      sortValue: (r) => r.value,
    },
  ]

  return (
    <AppShell title="Custom Reports" subtitle="Buat laporan sesuai kebutuhan: pilih dataset, dimensi, dan metrik">
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Dataset</label>
            <select
              value={dataset}
              onChange={(e) => {
                const d = e.target.value as Dataset
                setDataset(d)
                setDimension(DIMENSIONS_BY_DATASET[d][0])
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Karyawan</option>
              <option>Absensi</option>
              <option>KPI</option>
              <option>Payroll</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Group By</label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {DIMENSIONS_BY_DATASET[dataset].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Metrik</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="Jumlah">Jumlah</option>
              <option value="Rata-rata">Rata-rata</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="mt-4" title={`${metric} ${dataset} berdasarkan ${dimension}`}>
        <DepartmentBarChart data={chartData} valueLabel={metric} />
      </Card>

      <Card
        className="mt-4"
        action={
          <button
            onClick={() => exportEmployees(employees)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: 'var(--border)' }}
          >
            Export Data Karyawan
          </button>
        }
      >
        <DataTable columns={columns} rows={reportRows} pageSize={10} />
      </Card>
    </AppShell>
  )
}
