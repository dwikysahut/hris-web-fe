import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'

const TABS = ['Profil Perusahaan', 'Struktur Absensi', 'Notifikasi'] as const

export default function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Profil Perusahaan')

  return (
    <AppShell title="System Settings" subtitle="Konfigurasi profil perusahaan dan preferensi sistem">
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <Link to="/peran-akses" className="ml-auto text-sm font-medium" style={{ color: 'var(--series-1)' }}>
          Kelola Peran & Akses →
        </Link>
      </div>

      {tab === 'Profil Perusahaan' && (
        <Card title="Profil Perusahaan" subtitle="Informasi ini tampil pada slip gaji dan dokumen resmi">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama Perusahaan" value="PT adaCODE Teknologi Indonesia" />
            <Field label="NPWP Perusahaan" value="01.234.567.8-901.000" />
            <Field label="Alamat" value="Jl. Sudirman No. 88, Jakarta Selatan, DKI Jakarta" />
            <Field label="Industri" value="Teknologi Informasi" />
            <Field label="Jumlah Karyawan" value="140 orang" />
            <Field label="Tahun Berdiri" value="2018" />
          </div>
        </Card>
      )}

      {tab === 'Struktur Absensi' && (
        <Card title="Kebijakan Jam Kerja" subtitle="Aturan default untuk perhitungan absensi dan lembur">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Jam Masuk Standar" value="08:00 WIB" />
            <Field label="Jam Pulang Standar" value="17:00 WIB" />
            <Field label="Toleransi Keterlambatan" value="15 menit" />
            <Field label="Ambang Batas Lembur" value="Setelah 17:30 WIB" />
            <Field label="Hari Kerja" value="Senin – Jumat" />
            <Field label="Jatah Cuti Tahunan" value="12 hari / tahun" />
          </div>
        </Card>
      )}

      {tab === 'Notifikasi' && (
        <Card title="Preferensi Notifikasi" subtitle="Notifikasi email untuk aktivitas HR">
          <div className="space-y-3">
            {[
              'Pengajuan cuti baru menunggu persetujuan',
              'Pengajuan lembur baru menunggu persetujuan',
              'Klaim reimbursement baru diajukan',
              'Dokumen karyawan mendekati kedaluwarsa',
              'Payroll bulanan siap diproses',
            ].map((label, i) => (
              <label key={label} className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm text-[var(--text-primary)]">{label}</span>
                <input type="checkbox" defaultChecked={i < 4} className="h-4 w-4 accent-[var(--series-1)]" />
              </label>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)]" style={{ borderColor: 'var(--border)' }}>
        {value}
      </div>
    </div>
  )
}
