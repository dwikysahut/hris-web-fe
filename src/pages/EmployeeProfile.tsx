import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge, attendanceTone, employeeStatusTone, ratingTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'
import { formatCurrency, formatDate, initials } from '../lib/utils'
import type { AttendanceRecord, EmployeeDocument, KpiRecord, PayrollRecord } from '../lib/types'

const TABS = ['Ringkasan', 'Absensi', 'Kinerja', 'Dokumen', 'Payroll'] as const

export default function EmployeeProfile() {
  const { id } = useParams()
  const { employeeMap, attendance, kpi, documents, payroll } = useData()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Ringkasan')

  const employee = id ? employeeMap.get(id) : undefined

  const empAttendance = useMemo(() => attendance.filter((a) => a.employeeId === id).slice(0, 30), [attendance, id])
  const empKpi = useMemo(() => kpi.filter((k) => k.employeeId === id), [kpi, id])
  const empDocs = useMemo(() => documents.filter((d) => d.employeeId === id), [documents, id])
  const empPayroll = useMemo(() => payroll.filter((p) => p.employeeId === id), [payroll, id])

  if (!employee) {
    return (
      <AppShell title="Karyawan Tidak Ditemukan">
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">Data karyawan tidak ditemukan.</p>
          <Link to="/karyawan" className="mt-3 inline-block text-sm font-medium" style={{ color: 'var(--series-1)' }}>
            ← Kembali ke Employee Directory
          </Link>
        </Card>
      </AppShell>
    )
  }

  const attColumns: Column<AttendanceRecord>[] = [
    { key: 'date', header: 'Tanggal', render: (r) => formatDate(r.date), sortValue: (r) => r.date },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={attendanceTone(r.status)}>{r.status}</Badge> },
    { key: 'checkIn', header: 'Masuk', align: 'center', render: (r) => r.checkIn ?? '—' },
    { key: 'checkOut', header: 'Keluar', align: 'center', render: (r) => r.checkOut ?? '—' },
  ]

  const kpiColumns: Column<KpiRecord>[] = [
    { key: 'period', header: 'Periode', render: (r) => r.period, sortValue: (r) => r.period },
    { key: 'score', header: 'Skor', align: 'right', render: (r) => <span className="tabular-nums font-semibold">{r.overallScore}</span>, sortValue: (r) => r.overallScore },
    { key: 'rating', header: 'Rating', align: 'center', render: (r) => <Badge tone={ratingTone(r.rating)}>{r.rating}</Badge> },
  ]

  const docColumns: Column<EmployeeDocument>[] = [
    { key: 'name', header: 'Dokumen', render: (r) => r.name },
    { key: 'category', header: 'Kategori', render: (r) => r.category },
    { key: 'uploadedAt', header: 'Diunggah', render: (r) => formatDate(r.uploadedAt), sortValue: (r) => r.uploadedAt },
  ]

  const payColumns: Column<PayrollRecord>[] = [
    { key: 'period', header: 'Periode', render: (r) => r.period, sortValue: (r) => r.period },
    { key: 'netPay', header: 'Gaji Bersih', align: 'right', render: (r) => <span className="tabular-nums font-semibold">{formatCurrency(r.netPay)}</span>, sortValue: (r) => r.netPay },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={r.status === 'Dibayar' ? 'good' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <AppShell title="Employee Profile" subtitle={employee.employeeCode}>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ background: 'var(--series-1)' }}
            >
              {initials(employee.name)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{employee.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {employee.position} · {employee.department}
              </p>
              <div className="mt-1.5">
                <Badge tone={employeeStatusTone(employee.status)}>{employee.status}</Badge>
              </div>
            </div>
          </div>
          <Link
            to="/karyawan"
            className="text-sm font-medium"
            style={{ color: 'var(--series-1)' }}
          >
            ← Employee Directory
          </Link>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
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

      {tab === 'Ringkasan' && (
        <Card className="mt-4" title="Informasi Kepegawaian">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" value={employee.email} />
            <Field label="Telepon" value={employee.phone} />
            <Field label="Level" value={employee.level} />
            <Field label="Lokasi" value={employee.location} />
            <Field label="Tanggal Bergabung" value={formatDate(employee.joinDate)} />
            <Field label="Atasan" value={employee.manager} />
            <Field label="Salary Band" value={employee.salaryBand} />
            <Field label="Jenis Kelamin" value={employee.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
          </div>
        </Card>
      )}
      {tab === 'Absensi' && (
        <Card className="mt-4" title="Riwayat Absensi" subtitle="30 catatan terakhir">
          <DataTable columns={attColumns} rows={empAttendance} pageSize={10} />
        </Card>
      )}
      {tab === 'Kinerja' && (
        <Card className="mt-4" title="Riwayat Skor KPI">
          <DataTable columns={kpiColumns} rows={empKpi} pageSize={10} />
        </Card>
      )}
      {tab === 'Dokumen' && (
        <Card className="mt-4" title="Dokumen Karyawan">
          <DataTable columns={docColumns} rows={empDocs} pageSize={10} emptyLabel="Belum ada dokumen" />
        </Card>
      )}
      {tab === 'Payroll' && (
        <Card className="mt-4" title="Riwayat Payroll">
          <DataTable columns={payColumns} rows={empPayroll} pageSize={10} />
        </Card>
      )}
    </AppShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
