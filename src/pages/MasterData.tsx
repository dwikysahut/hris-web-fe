import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'

const TABS = ['Departemen', 'Lokasi', 'Jenis Cuti', 'Rentang Gaji'] as const

const LEAVE_TYPES = [
  { name: 'Cuti Tahunan', quota: '12 hari/tahun', description: 'Cuti reguler karyawan tetap' },
  { name: 'Sakit', quota: 'Sesuai surat dokter', description: 'Memerlukan surat keterangan dokter' },
  { name: 'Izin', quota: 'Kebijakan atasan', description: 'Keperluan pribadi mendesak' },
  { name: 'Cuti Melahirkan', quota: '90 hari', description: 'Sesuai UU Ketenagakerjaan' },
  { name: 'Cuti Menikah', quota: '3 hari', description: 'Pernikahan karyawan' },
  { name: 'Duka Cita', quota: '2 hari', description: 'Kedukaan keluarga inti' },
]

const SALARY_RANGES_BY_LEVEL = [
  { level: 'Staff', range: 'Rp 6.500.000 – Rp 8.500.000' },
  { level: 'Supervisor', range: 'Rp 10.000.000 – Rp 13.500.000' },
  { level: 'Manager', range: 'Rp 16.000.000 – Rp 20.000.000' },
  { level: 'Head', range: 'Rp 24.000.000 – Rp 30.000.000' },
  { level: 'Director', range: 'Rp 38.000.000 – Rp 46.000.000' },
]

export default function MasterData() {
  const { employees } = useData()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Departemen')

  const departments = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of employees) if (e.status !== 'Nonaktif') map.set(e.department, (map.get(e.department) ?? 0) + 1)
    return Array.from(map.entries()).map(([name, headcount]) => ({ name, headcount }))
  }, [employees])

  const locations = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of employees) if (e.status !== 'Nonaktif') map.set(e.location, (map.get(e.location) ?? 0) + 1)
    return Array.from(map.entries()).map(([name, headcount]) => ({ name, headcount }))
  }, [employees])

  const deptColumns: Column<{ name: string; headcount: number }>[] = [
    { key: 'name', header: 'Nama Departemen', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'headcount', header: 'Jumlah Karyawan', align: 'right', render: (r) => r.headcount },
  ]
  const locColumns: Column<{ name: string; headcount: number }>[] = [
    { key: 'name', header: 'Nama Lokasi', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'headcount', header: 'Jumlah Karyawan', align: 'right', render: (r) => r.headcount },
  ]
  const leaveColumns: Column<(typeof LEAVE_TYPES)[number]>[] = [
    { key: 'name', header: 'Jenis Cuti', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'quota', header: 'Kuota', render: (r) => r.quota },
    { key: 'description', header: 'Keterangan', render: (r) => r.description },
  ]
  const rangeColumns: Column<(typeof SALARY_RANGES_BY_LEVEL)[number]>[] = [
    { key: 'level', header: 'Level', render: (r) => <span className="font-medium">{r.level}</span> },
    { key: 'range', header: 'Rentang Gaji Pokok', render: (r) => r.range },
  ]

  return (
    <AppShell title="Master Data" subtitle="Data referensi yang digunakan di seluruh modul HRIS">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
            style={
              tab === t
                ? { background: 'var(--series-1)', color: '#fff' }
                : { background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {t}
          </button>
        ))}
      </div>
      <Card>
        {tab === 'Departemen' && <DataTable columns={deptColumns} rows={departments} pageSize={10} />}
        {tab === 'Lokasi' && <DataTable columns={locColumns} rows={locations} pageSize={10} />}
        {tab === 'Jenis Cuti' && <DataTable columns={leaveColumns} rows={LEAVE_TYPES} pageSize={10} />}
        {tab === 'Rentang Gaji' && <DataTable columns={rangeColumns} rows={SALARY_RANGES_BY_LEVEL} pageSize={10} />}
      </Card>
    </AppShell>
  )
}
