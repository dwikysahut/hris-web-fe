import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { KpiScoreChart } from '../components/charts/KpiScoreChart'
import { useData } from '../lib/dataStore'
import { initials } from '../lib/utils'

export default function Assessment() {
  const { kpi, employeeMap } = useData()
  const periods = useMemo(() => Array.from(new Set(kpi.map((k) => k.period))).sort(), [kpi])
  const [period, setPeriod] = useState(periods[periods.length - 1])
  const periodRecords = useMemo(() => kpi.filter((k) => k.period === period), [kpi, period])
  const [employeeId, setEmployeeId] = useState(periodRecords[0]?.employeeId ?? '')

  const record = periodRecords.find((k) => k.employeeId === employeeId) ?? periodRecords[0]
  const employee = record ? employeeMap.get(record.employeeId) : undefined

  const avgProductivity = periodRecords.length ? periodRecords.reduce((s, k) => s + k.productivity, 0) / periodRecords.length : 0
  const avgQuality = periodRecords.length ? periodRecords.reduce((s, k) => s + k.quality, 0) / periodRecords.length : 0
  const avgDiscipline = periodRecords.length ? periodRecords.reduce((s, k) => s + k.discipline, 0) / periodRecords.length : 0

  return (
    <AppShell title="Assessment" subtitle="Rincian kriteria penilaian kinerja per karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Rata-rata Produktivitas" value={avgProductivity.toFixed(1)} />
        <StatCard label="Rata-rata Kualitas Kerja" value={avgQuality.toFixed(1)} />
        <StatCard label="Rata-rata Kedisiplinan" value={avgDiscipline.toFixed(1)} />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value)
              setEmployeeId('')
            }}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={employeeId || periodRecords[0]?.employeeId || ''}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {periodRecords.map((k) => (
              <option key={k.employeeId} value={k.employeeId}>
                {employeeMap.get(k.employeeId)?.name ?? k.employeeId}
              </option>
            ))}
          </select>
        </div>

        {record && employee ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4 xl:col-span-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: 'var(--series-1)' }}>
                {initials(employee.name)}
              </div>
              <div>
                <div className="font-medium">{employee.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{employee.position}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">Skor Akhir: <span className="font-semibold text-[var(--text-primary)]">{record.overallScore}</span></div>
              </div>
            </div>
            <div className="xl:col-span-2">
              <KpiScoreChart
                height={240}
                data={[
                  { label: 'Produktivitas', score: record.productivity },
                  { label: 'Kualitas Kerja', score: record.quality },
                  { label: 'Kedisiplinan', score: record.discipline },
                  { label: 'Kerjasama Tim', score: record.teamwork },
                  { label: 'Inisiatif', score: record.initiative },
                ]}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Tidak ada data penilaian untuk periode ini.</p>
        )}
      </Card>
    </AppShell>
  )
}
