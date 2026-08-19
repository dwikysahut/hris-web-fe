import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { TrainingProgram } from '../lib/types'

const CATEGORIES: TrainingProgram['category'][] = ['Teknis', 'Kepemimpinan', 'Soft Skill', 'Kepatuhan']
const STATUSES: TrainingProgram['status'][] = ['Terjadwal', 'Berlangsung', 'Selesai']

const BLANK_FORM = {
  title: '',
  category: CATEGORIES[0],
  provider: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  quota: 20,
  enrolled: 0,
  status: 'Terjadwal' as TrainingProgram['status'],
}

export default function Training() {
  const { trainingPrograms, trainingParticipants, employeeMap, addTrainingProgram, updateTrainingProgram, deleteTrainingProgram } = useData()
  const [selected, setSelected] = useState<string | null>(trainingPrograms[0]?.id ?? null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<TrainingProgram | null>(null)

  const ongoing = trainingPrograms.filter((p) => p.status === 'Berlangsung').length
  const scheduled = trainingPrograms.filter((p) => p.status === 'Terjadwal').length
  const totalEnrolled = trainingPrograms.reduce((s, p) => s + p.enrolled, 0)
  const certificatesIssued = trainingParticipants.filter((p) => p.certificate).length

  const participantsForSelected = useMemo(
    () => trainingParticipants.filter((p) => p.programId === selected),
    [trainingParticipants, selected]
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (program: TrainingProgram) => {
    setEditingId(program.id)
    setForm({
      title: program.title,
      category: program.category,
      provider: program.provider,
      startDate: program.startDate,
      endDate: program.endDate,
      quota: program.quota,
      enrolled: program.enrolled,
      status: program.status,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateTrainingProgram(editingId, form)
    } else {
      addTrainingProgram({ id: makeId('TRN'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteTrainingProgram(deleteTarget.id)
      if (selected === deleteTarget.id) setSelected(null)
    }
    setDeleteTarget(null)
  }

  const programColumns: Column<TrainingProgram>[] = [
    {
      key: 'title',
      header: 'Program',
      render: (p) => (
        <button className="text-left" onClick={() => setSelected(p.id)}>
          <div className="font-medium hover:underline">{p.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{p.provider}</div>
        </button>
      ),
      sortValue: (p) => p.title,
    },
    { key: 'category', header: 'Kategori', render: (p) => p.category, sortValue: (p) => p.category },
    {
      key: 'period',
      header: 'Periode',
      render: (p) => `${formatDate(p.startDate)} — ${formatDate(p.endDate)}`,
      sortValue: (p) => p.startDate,
    },
    {
      key: 'enrolled',
      header: 'Peserta',
      align: 'right',
      render: (p) => `${p.enrolled} / ${p.quota}`,
      sortValue: (p) => p.enrolled,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => <Badge tone={approvalTone(p.status)}>{p.status}</Badge>,
      sortValue: (p) => p.status,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(p)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(p)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  const selectedProgram = trainingPrograms.find((p) => p.id === selected)

  return (
    <AppShell title="Pelatihan" subtitle="Program pengembangan kompetensi dan sertifikasi karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Program Berlangsung" value={ongoing.toLocaleString('id-ID')} />
        <StatCard label="Program Terjadwal" value={scheduled.toLocaleString('id-ID')} />
        <StatCard label="Total Peserta" value={totalEnrolled.toLocaleString('id-ID')} />
        <StatCard label="Sertifikat Terbit" value={certificatesIssued.toLocaleString('id-ID')} />
      </div>

      <Card className="mt-4" title="Program Pelatihan" subtitle="Klik nama program untuk melihat daftar peserta">
        <div className="mb-4 flex justify-end">
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Program
          </button>
        </div>
        <DataTable columns={programColumns} rows={trainingPrograms} pageSize={9} emptyLabel="Tidak ada program pelatihan" />
      </Card>

      {selectedProgram && (
        <Card className="mt-4" title={`Peserta — ${selectedProgram.title}`} subtitle={`${participantsForSelected.length} karyawan terdaftar`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {participantsForSelected.map((p) => {
              const emp = employeeMap.get(p.employeeId)
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: 'var(--gridline)' }}>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--series-4)' }}
                  >
                    {initials(emp?.name ?? '-')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{emp?.name ?? p.employeeId}</div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                      {p.completionPct}% selesai{p.score !== null ? ` · Skor ${p.score}` : ''}
                    </div>
                  </div>
                  {p.certificate && <Badge tone="good">Sertifikat</Badge>}
                </div>
              )
            })}
            {participantsForSelected.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Belum ada peserta terdaftar.</p>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Program Pelatihan' : 'Tambah Program Pelatihan'}
        subtitle={editingId ? 'Perbarui data program pelatihan' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Judul Program">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TrainingProgram['category'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Penyelenggara">
            <input
              required
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TrainingProgram['status'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Mulai">
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tanggal Selesai">
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Kuota">
            <input
              required
              type="number"
              min={1}
              value={form.quota}
              onChange={(e) => setForm((f) => ({ ...f, quota: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Peserta Terdaftar">
            <input
              required
              type="number"
              min={0}
              value={form.enrolled}
              onChange={(e) => setForm((f) => ({ ...f, enrolled: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>

          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              {editingId ? 'Simpan Perubahan' : 'Tambah Program'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Program Pelatihan"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.title}</span> dari
          daftar program pelatihan?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Batal
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--status-critical)' }}
          >
            Hapus
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  )
}
