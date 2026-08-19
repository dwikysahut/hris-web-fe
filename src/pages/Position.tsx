import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'

interface PositionRow {
  position: string
  department: string
  headcount: number
  avgKpi: number | null
}

export default function Position() {
  const { employees, kpi } = useData()
  const [query, setQuery] = useState('')

  const latestPeriod = useMemo(() => {
    const periods = Array.from(new Set(kpi.map((k) => k.period))).sort()
    return periods[periods.length - 1]
  }, [kpi])

  const rows: PositionRow[] = useMemo(() => {
    const active = employees.filter((e) => e.status !== 'Nonaktif')
    const map = new Map<string, { department: string; employeeIds: string[] }>()
    for (const e of active) {
      const key = `${e.position}__${e.department}`
      const bucket = map.get(key) ?? { department: e.department, employeeIds: [] }
      bucket.employeeIds.push(e.id)
      map.set(key, bucket)
    }
    return Array.from(map.entries()).map(([key, bucket]) => {
      const position = key.split('__')[0]
      const scores = kpi.filter((k) => k.period === latestPeriod && bucket.employeeIds.includes(k.employeeId)).map((k) => k.overallScore)
      return {
        position,
        department: bucket.department,
        headcount: bucket.employeeIds.length,
        avgKpi: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      }
    })
  }, [employees, kpi, latestPeriod])

  const filtered = rows.filter((r) => !query || r.position.toLowerCase().includes(query.toLowerCase()))

  const columns: Column<PositionRow>[] = [
    { key: 'position', header: 'Posisi', render: (r) => <span className="font-medium">{r.position}</span>, sortValue: (r) => r.position },
    { key: 'department', header: 'Departemen', render: (r) => r.department, sortValue: (r) => r.department },
    { key: 'headcount', header: 'Jumlah Karyawan', align: 'right', render: (r) => r.headcount, sortValue: (r) => r.headcount },
    {
      key: 'avgKpi',
      header: 'Rata-rata KPI',
      align: 'right',
      render: (r) => (r.avgKpi !== null ? <span className="tabular-nums">{r.avgKpi}</span> : <span className="text-[var(--text-muted)]">—</span>),
      sortValue: (r) => r.avgKpi ?? -1,
    },
  ]

  return (
    <AppShell title="Position" subtitle="Daftar posisi/jabatan dan distribusi karyawan di dalamnya">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Posisi Unik" value={rows.length.toLocaleString('id-ID')} />
        <StatCard label="Posisi Terbesar" value={[...rows].sort((a, b) => b.headcount - a.headcount)[0]?.position ?? '-'} />
        <StatCard label="Rata-rata Karyawan/Posisi" value={(rows.reduce((s, r) => s + r.headcount, 0) / Math.max(1, rows.length)).toFixed(1)} />
      </div>
      <Card className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari posisi..."
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm sm:max-w-xs"
          style={{ borderColor: 'var(--border)' }}
        />
        <DataTable columns={columns} rows={filtered} pageSize={12} emptyLabel="Tidak ada posisi ditemukan" />
      </Card>
    </AppShell>
  )
}
