import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { ApprovalStatus, OvertimeRequest } from '../lib/types'

const COMPENSATIONS: OvertimeRequest['compensation'][] = ['Uang Lembur', 'Ganti Hari']

const BLANK_FORM = {
  employeeId: '',
  date: new Date().toISOString().slice(0, 10),
  hours: 1,
  reason: '',
  status: 'Menunggu' as ApprovalStatus,
  compensation: 'Uang Lembur' as OvertimeRequest['compensation'],
}

export default function Overtime() {
  const { overtimeRequests, employees, employeeMap, setOvertimeStatus, addOvertimeRequest, updateOvertimeRequest, deleteOvertimeRequest } =
    useData()
  const [status, setStatus] = useState<'Semua' | ApprovalStatus>('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<OvertimeRequest | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (r: OvertimeRequest) => {
    setEditingId(r.id)
    setForm({
      employeeId: r.employeeId,
      date: r.date,
      hours: r.hours,
      reason: r.reason,
      status: r.status,
      compensation: r.compensation,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateOvertimeRequest(editingId, form)
    } else {
      addOvertimeRequest({ id: makeId('OT'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteOvertimeRequest(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(
    () => (status === 'Semua' ? overtimeRequests : overtimeRequests.filter((r) => r.status === status)),
    [overtimeRequests, status]
  )

  const totalHours = overtimeRequests
    .filter((r) => r.status === 'Disetujui')
    .reduce((s, r) => s + r.hours, 0)
  const pending = overtimeRequests.filter((r) => r.status === 'Menunggu').length
  const approved = overtimeRequests.filter((r) => r.status === 'Disetujui').length

  const columns: Column<OvertimeRequest>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-4)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? r.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </div>
        )
      },
      sortValue: (r) => employeeMap.get(r.employeeId)?.name ?? '',
    },
    { key: 'date', header: 'Tanggal', render: (r) => formatDate(r.date), sortValue: (r) => r.date },
    { key: 'hours', header: 'Jam', align: 'right', render: (r) => `${r.hours} jam`, sortValue: (r) => r.hours },
    { key: 'reason', header: 'Alasan', render: (r) => r.reason },
    { key: 'compensation', header: 'Kompensasi', render: (r) => r.compensation },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={approvalTone(r.status)}>{r.status}</Badge>,
      sortValue: (r) => r.status,
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      render: (r) =>
        r.status === 'Menunggu' ? (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setOvertimeStatus(r.id, 'Disetujui')}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: 'var(--status-good)' }}
            >
              Setujui
            </button>
            <button
              onClick={() => setOvertimeStatus(r.id, 'Ditolak')}
              className="rounded-md border px-2.5 py-1 text-xs font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--status-critical)' }}
            >
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(r)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Lembur" subtitle="Pengajuan dan persetujuan jam kerja lembur karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengajuan" value={overtimeRequests.length.toLocaleString('id-ID')} />
        <StatCard label="Menunggu Persetujuan" value={pending.toLocaleString('id-ID')} positive={pending === 0} />
        <StatCard label="Disetujui" value={approved.toLocaleString('id-ID')} />
        <StatCard label="Total Jam Disetujui" value={`${totalHours.toLocaleString('id-ID')} jam`} deltaLabel="periode berjalan" />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <option>Semua</option>
            <option>Menunggu</option>
            <option>Disetujui</option>
            <option>Ditolak</option>
          </select>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Lembur
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada pengajuan lembur" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Pengajuan Lembur' : 'Tambah Lembur'}
        subtitle={editingId ? 'Perbarui data pengajuan lembur' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Karyawan">
            <select
              required
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="">Pilih karyawan</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Jam Lembur">
            <input
              required
              type="number"
              min={1}
              value={form.hours}
              onChange={(e) => setForm((f) => ({ ...f, hours: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Kompensasi">
            <select
              value={form.compensation}
              onChange={(e) => setForm((f) => ({ ...f, compensation: e.target.value as OvertimeRequest['compensation'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {COMPENSATIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApprovalStatus }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Menunggu</option>
              <option>Disetujui</option>
              <option>Ditolak</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Alasan">
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </FormField>
          </div>

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
              {editingId ? 'Simpan Perubahan' : 'Tambah Lembur'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pengajuan Lembur"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus pengajuan lembur{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {employeeMap.get(deleteTarget?.employeeId ?? '')?.name ?? deleteTarget?.employeeId}
          </span>{' '}
          ini?
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
