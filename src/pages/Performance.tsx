import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, ratingTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { KpiTrendChart, type KpiTrendPoint } from '../components/charts/KpiTrendChart'
import { KpiScoreChart } from '../components/charts/KpiScoreChart'
import { useData } from '../lib/dataStore'
import { exportKpi } from '../lib/excel'
import { formatMonth, initials } from '../lib/utils'
import type { KpiRecord } from '../lib/types'

export default function Performance() {
  const { kpi, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(kpi.map((k) => k.period))).sort(), [kpi])
  const [period, setPeriod] = useState(periods[periods.length - 1])
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  const periodRecords = useMemo(() => kpi.filter((k) => k.period === period), [kpi, period])

  const avgScore = useMemo(
    () => (periodRecords.length ? periodRecords.reduce((s, k) => s + k.overallScore, 0) / periodRecords.length : 0),
    [periodRecords]
  )
  const topRated = periodRecords.filter((k) => k.rating === 'A').length
  const lowRated = periodRecords.filter((k) => k.rating === 'D').length

  const trendData: KpiTrendPoint[] = useMemo(() => {
    return periods.map((p) => {
      const recs = kpi.filter((k) => k.period === p)
      const avg = recs.length ? recs.reduce((s, k) => s + k.overallScore, 0) / recs.length : 0
      return { period: p, label: formatMonth(p).split(' ')[0], avgScore: avg }
    })
  }, [kpi, periods])

  const byDepartment = useMemo(() => {
    const sums = new Map<string, { total: number; count: number }>()
    for (const k of periodRecords) {
      const emp = employeeMap.get(k.employeeId)
      if (!emp) continue
      const bucket = sums.get(emp.department) ?? { total: 0, count: 0 }
      bucket.total += k.overallScore
      bucket.count += 1
      sums.set(emp.department, bucket)
    }
    return Array.from(sums.entries())
      .map(([label, { total, count }]) => ({ label, score: Math.round(total / count) }))
      .sort((a, b) => b.score - a.score)
  }, [periodRecords, employeeMap])

  const detail = useMemo(() => {
    if (!selectedEmployee) return null
    return periodRecords.find((k) => k.employeeId === selectedEmployee) ?? null
  }, [selectedEmployee, periodRecords])

  const columns: Column<KpiRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <button className="flex w-full items-center gap-3 text-left" onClick={() => setSelectedEmployee(r.employeeId)}>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--series-3)' }}
            >
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? r.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </button>
        )
      },
      sortValue: (r) => employeeMap.get(r.employeeId)?.name ?? '',
    },
    {
      key: 'score',
      header: 'Skor Akhir',
      align: 'right',
      render: (r) => <span className="tabular-nums font-semibold">{r.overallScore}</span>,
      sortValue: (r) => r.overallScore,
    },
    {
      key: 'achievement',
      header: 'Pencapaian Target',
      align: 'right',
      render: (r) => <span className="tabular-nums">{r.achievement}%</span>,
      sortValue: (r) => r.achievement,
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'center',
      render: (r) => <Badge tone={ratingTone(r.rating)}>{r.rating}</Badge>,
      sortValue: (r) => r.rating,
    },
  ]

  return (
    <AppShell title="Kinerja KPI" subtitle="Evaluasi kinerja karyawan berbasis indikator kunci">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rata-rata Skor" value={avgScore.toFixed(1)} deltaLabel={formatMonth(period)} positive={avgScore >= 75} />
        <StatCard label="Rating A" value={topRated.toLocaleString('id-ID')} deltaLabel="karyawan berprestasi" />
        <StatCard label="Rating D" value={lowRated.toLocaleString('id-ID')} deltaLabel="butuh pembinaan" positive={lowRated === 0} />
        <StatCard label="Total Dinilai" value={periodRecords.length.toLocaleString('id-ID')} deltaLabel="karyawan dievaluasi" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Tren Skor KPI" subtitle="Rata-rata skor perusahaan per bulan" className="xl:col-span-2">
          <KpiTrendChart data={trendData} />
        </Card>
        <Card title="Skor per Departemen" subtitle={formatMonth(period)}>
          <KpiScoreChart data={byDepartment} height={260} />
        </Card>
      </div>

      {detail && (
        <Card className="mt-4" title={`Rincian KPI — ${employeeMap.get(detail.employeeId)?.name}`} subtitle={formatMonth(period)}>
          <KpiScoreChart
            height={220}
            data={[
              { label: 'Produktivitas', score: detail.productivity },
              { label: 'Kualitas Kerja', score: detail.quality },
              { label: 'Kedisiplinan', score: detail.discipline },
              { label: 'Kerjasama Tim', score: detail.teamwork },
              { label: 'Inisiatif', score: detail.initiative },
            ]}
          />
        </Card>
      )}

      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value)
              setSelectedEmployee(null)
            }}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {formatMonth(p)}
              </option>
            ))}
          </select>
          <button
            onClick={() => exportKpi(periodRecords, employeeMap)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            Export Excel
          </button>
        </div>
        <DataTable columns={columns} rows={periodRecords} pageSize={10} emptyLabel="Tidak ada data KPI" />
      </Card>
    </AppShell>
  )
}
