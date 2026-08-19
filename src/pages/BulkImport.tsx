import { useRef, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData, makeImportId } from '../lib/dataStore'
import {
  downloadAttendanceTemplate,
  downloadEmployeeTemplate,
  exportAttendance,
  exportEmployees,
  exportKpi,
  parseWorkbookFile,
} from '../lib/excel'
import { formatDateTime } from '../lib/utils'
import type { AttendanceRecord, AttendanceStatus, Employee, ImportLogEntry, KpiRecord } from '../lib/types'

type ImportType = 'Karyawan' | 'Absensi' | 'KPI'

const TYPES: { value: ImportType; label: string; description: string }[] = [
  { value: 'Karyawan', label: 'Data Karyawan', description: 'Master data karyawan: identitas, jabatan, departemen' },
  { value: 'Absensi', label: 'Data Absensi', description: 'Rekap kehadiran harian per karyawan' },
  { value: 'KPI', label: 'Data KPI', description: 'Skor penilaian kinerja bulanan per karyawan' },
]

let genCounter = 500000
function genId(prefix: string) {
  genCounter += 1
  return `${prefix}-${genCounter}`
}

export default function BulkImport() {
  const { employees, attendance, kpi, importLog, employeeMap, addEmployees, addAttendance, addKpi, pushImportLog } =
    useData()
  const [type, setType] = useState<ImportType>('Karyawan')
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([])
  const [status, setStatus] = useState<{ tone: 'good' | 'critical' | 'warning'; message: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setStatus(null)
    try {
      const { rows } = await parseWorkbookFile(file)
      setPreviewRows(rows)
    } catch {
      setStatus({ tone: 'critical', message: 'Gagal membaca file. Pastikan format .xlsx / .csv valid.' })
      setPreviewRows([])
    }
  }

  function commitImport() {
    if (previewRows.length === 0) {
      setStatus({ tone: 'warning', message: 'Tidak ada baris untuk diimpor.' })
      return
    }
    let processed = 0
    let failed = 0

    if (type === 'Karyawan') {
      const rows: Employee[] = []
      for (const r of previewRows) {
        const name = String(r['Nama'] ?? '').trim()
        if (!name) {
          failed++
          continue
        }
        rows.push({
          id: genId('EMP'),
          employeeCode: String(r['Kode Karyawan'] ?? genId('ADW')),
          name,
          email: String(r['Email'] ?? ''),
          phone: String(r['Telepon'] ?? ''),
          department: (String(r['Departemen'] ?? 'Engineering') as Employee['department']),
          position: String(r['Posisi'] ?? '-'),
          level: (String(r['Level'] ?? 'Staff') as Employee['level']),
          joinDate: String(r['Tanggal Bergabung'] ?? new Date().toISOString().slice(0, 10)),
          status: (String(r['Status'] ?? 'Aktif') as Employee['status']),
          gender: (String(r['Jenis Kelamin'] ?? 'L') as Employee['gender']),
          location: String(r['Lokasi'] ?? 'Jakarta HQ'),
          manager: String(r['Atasan'] ?? '-'),
          salaryBand: (String(r['Salary Band'] ?? 'Band 1') as Employee['salaryBand']),
          exitDate: null,
          exitReason: null,
        })
        processed++
      }
      addEmployees(rows)
    } else if (type === 'Absensi') {
      const rows: AttendanceRecord[] = []
      for (const r of previewRows) {
        const code = String(r['Kode Karyawan'] ?? '')
        const emp = employees.find((e) => e.employeeCode === code)
        if (!emp) {
          failed++
          continue
        }
        rows.push({
          id: genId('ATT'),
          employeeId: emp.id,
          date: String(r['Tanggal'] ?? ''),
          status: (String(r['Status'] ?? 'Hadir') as AttendanceStatus),
          checkIn: r['Jam Masuk'] ? String(r['Jam Masuk']) : null,
          checkOut: r['Jam Keluar'] ? String(r['Jam Keluar']) : null,
          workHours: Number(r['Jam Kerja'] ?? 0),
        })
        processed++
      }
      addAttendance(rows)
    } else {
      const rows: KpiRecord[] = []
      for (const r of previewRows) {
        const code = String(r['Kode Karyawan'] ?? '')
        const emp = employees.find((e) => e.employeeCode === code)
        if (!emp) {
          failed++
          continue
        }
        const overallScore = Number(r['Skor Akhir'] ?? 0)
        rows.push({
          id: genId('KPI'),
          employeeId: emp.id,
          period: String(r['Periode'] ?? ''),
          productivity: Number(r['Produktivitas'] ?? 0),
          quality: Number(r['Kualitas'] ?? 0),
          discipline: Number(r['Kedisiplinan'] ?? 0),
          teamwork: Number(r['Kerjasama'] ?? 0),
          initiative: Number(r['Inisiatif'] ?? 0),
          target: Number(r['Target'] ?? 100),
          achievement: Number(r['Pencapaian'] ?? 0),
          overallScore,
          rating: overallScore >= 88 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : 'D',
        })
        processed++
      }
      addKpi(rows)
    }

    const entry: ImportLogEntry = {
      id: makeImportId(),
      fileName: fileName ?? 'unknown.xlsx',
      type,
      rowsProcessed: processed,
      rowsFailed: failed,
      importedAt: new Date().toISOString(),
      status: failed === 0 ? 'Sukses' : processed === 0 ? 'Gagal' : 'Sebagian Gagal',
    }
    pushImportLog(entry)
    setStatus({
      tone: failed === 0 ? 'good' : processed === 0 ? 'critical' : 'warning',
      message: `${processed} baris berhasil diimpor${failed ? `, ${failed} baris gagal` : ''}.`,
    })
    setPreviewRows([])
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const logColumns: Column<ImportLogEntry>[] = [
    { key: 'fileName', header: 'Nama File', render: (r) => <span className="font-medium">{r.fileName}</span> },
    { key: 'type', header: 'Jenis Data', render: (r) => r.type },
    {
      key: 'rows',
      header: 'Baris',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums">
          {r.rowsProcessed}
          {r.rowsFailed > 0 && <span style={{ color: 'var(--status-critical)' }}> ({r.rowsFailed} gagal)</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => (
        <Badge tone={r.status === 'Sukses' ? 'good' : r.status === 'Sebagian Gagal' ? 'warning' : 'critical'}>
          {r.status}
        </Badge>
      ),
    },
    { key: 'importedAt', header: 'Waktu Import', render: (r) => formatDateTime(r.importedAt), sortValue: (r) => r.importedAt },
  ]

  const previewColumns: Column<Record<string, unknown>>[] = previewRows[0]
    ? Object.keys(previewRows[0]).map((key) => ({
        key,
        header: key,
        render: (row) => String(row[key] ?? ''),
      }))
    : []

  return (
    <AppShell title="Import & Data Warehouse" subtitle="Import massal via Excel dan riwayat pemuatan data">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Data Karyawan" value={employees.length.toLocaleString('id-ID')} />
        <StatCard label="Total Data Absensi" value={attendance.length.toLocaleString('id-ID')} />
        <StatCard label="Total Data KPI" value={kpi.length.toLocaleString('id-ID')} />
        <StatCard label="Riwayat Import" value={importLog.length.toLocaleString('id-ID')} deltaLabel="proses tercatat" />
      </div>

      <Card className="mt-4" title="Import Data Massal" subtitle="Unggah file Excel (.xlsx) sesuai template untuk memuat data ke sistem">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setType(t.value)
                setPreviewRows([])
                setFileName(null)
                setStatus(null)
              }}
              className="rounded-lg border p-4 text-left transition-colors"
              style={{
                borderColor: type === t.value ? 'var(--series-1)' : 'var(--border)',
                background: type === t.value ? 'rgba(42,120,214,0.06)' : 'var(--surface-1)',
              }}
            >
              <div className="text-sm font-semibold text-[var(--text-primary)]">{t.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left" style={{ borderColor: 'var(--baseline)' }}>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {fileName ? `File dipilih: ${fileName}` : 'Belum ada file dipilih'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Format: .xlsx / .xls / .csv — gunakan template agar kolom sesuai
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-2">
            <button
              onClick={() => (type === 'Karyawan' ? downloadEmployeeTemplate() : downloadAttendanceTemplate())}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Unduh Template
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              Pilih File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
        </div>

        {status && (
          <div className="mt-3">
            <Badge tone={status.tone}>{status.message}</Badge>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Pratinjau ({previewRows.length} baris terdeteksi)
              </h4>
              <button
                onClick={commitImport}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: 'var(--status-good)' }}
              >
                Konfirmasi Import
              </button>
            </div>
            <DataTable columns={previewColumns} rows={previewRows.slice(0, 50)} pageSize={5} />
          </div>
        )}
      </Card>

      <Card
        className="mt-4"
        title="Riwayat Import"
        subtitle="Log data warehouse — setiap proses pemuatan data tercatat di sini"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => exportEmployees(employees)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              Export Karyawan
            </button>
            <button
              onClick={() => exportAttendance(attendance, employeeMap)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              Export Absensi
            </button>
            <button
              onClick={() => exportKpi(kpi, employeeMap)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              Export KPI
            </button>
          </div>
        }
      >
        <DataTable columns={logColumns} rows={importLog} pageSize={8} emptyLabel="Belum ada riwayat import" />
      </Card>
    </AppShell>
  )
}
