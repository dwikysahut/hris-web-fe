import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { ApprovalStatus, LeaveRequest, LeaveType } from '../lib/types'

const LEAVE_TYPES: LeaveType[] = ['Cuti Tahunan', 'Sakit', 'Izin', 'Cuti Melahirkan', 'Cuti Menikah', 'Duka Cita']

const BLANK_FORM = {
  employeeId: '',
  type: 'Cuti Tahunan' as LeaveType,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  days: 1,
  reason: '',
  status: 'Menunggu' as ApprovalStatus,
  requestedAt: new Date().toISOString().slice(0, 10),
  balanceBefore: 12,
}

export default function LeaveManagement() {
  const { leaveRequests, employees, employeeMap, setLeaveStatus, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } =
    useData()
  const [status, setStatus] = useState<'Semua' | ApprovalStatus>('Semua')
  const [type, setType] = useState('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (r: LeaveRequest) => {
    setEditingId(r.id)
    setForm({
      employeeId: r.employeeId,
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.days,
      reason: r.reason,
      status: r.status,
      requestedAt: r.requestedAt,
      balanceBefore: r.balanceBefore,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateLeaveRequest(editingId, form)
    } else {
      addLeaveRequest({ id: makeId('LR'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteLeaveRequest(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(
    () =>
      leaveRequests.filter((r) => (status === 'Semua' || r.status === status) && (type === 'Semua' || r.type === type)),
    [leaveRequests, status, type]
  )

  const pending = leaveRequests.filter((r) => r.status === 'Menunggu').length
  const approved = leaveRequests.filter((r) => r.status === 'Disetujui').length
  const onLeaveToday = leaveRequests.filter(
    (r) => r.status === 'Disetujui' && r.startDate <= '2026-08-19' && r.endDate >= '2026-08-19'
  ).length

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of leaveRequests) {
      if (r.status !== 'Disetujui') continue
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      counts.set(dept, (counts.get(dept) ?? 0) + r.days)
    }
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [leaveRequests, employeeMap])

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-5)' }}>
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
    { key: 'type', header: 'Jenis', render: (r) => r.type, sortValue: (r) => r.type },
    {
      key: 'period',
      header: 'Periode',
      render: (r) => `${formatDate(r.startDate)} — ${formatDate(r.endDate)}`,
      sortValue: (r) => r.startDate,
    },
    { key: 'days', header: 'Hari', align: 'right', render: (r) => r.days, sortValue: (r) => r.days },
    { key: 'reason', header: 'Alasan', render: (r) => r.reason },
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
              onClick={() => setLeaveStatus(r.id, 'Disetujui')}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: 'var(--status-good)' }}
            >
              Setujui
            </button>
            <button
              onClick={() => setLeaveStatus(r.id, 'Ditolak')}
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
    <AppShell title="Pengajuan Cuti" subtitle="Kelola pengajuan cuti, izin, dan sakit karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengajuan" value={leaveRequests.length.toLocaleString('id-ID')} />
        <StatCard label="Menunggu Persetujuan" value={pending.toLocaleString('id-ID')} positive={pending === 0} />
        <StatCard label="Disetujui" value={approved.toLocaleString('id-ID')} />
        <StatCard label="Sedang Cuti Hari Ini" value={onLeaveToday.toLocaleString('id-ID')} />
      </div>

      <Card className="mt-4" title="Hari Cuti Disetujui per Departemen" subtitle="Total hari cuti terpakai — periode berjalan">
        <DepartmentBarChart data={byDepartment} valueLabel="Hari" />
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
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
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              <option>Cuti Tahunan</option>
              <option>Sakit</option>
              <option>Izin</option>
              <option>Cuti Melahirkan</option>
              <option>Cuti Menikah</option>
              <option>Duka Cita</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Cuti
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada pengajuan cuti" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Pengajuan Cuti' : 'Tambah Cuti'}
        subtitle={editingId ? 'Perbarui data pengajuan cuti' : 'Data akan disimpan sebagai data simulasi'}
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
          <FormField label="Jenis Cuti">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LeaveType }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t}>{t}</option>
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
          <FormField label="Jumlah Hari">
            <input
              required
              type="number"
              min={1}
              value={form.days}
              onChange={(e) => setForm((f) => ({ ...f, days: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Sisa Saldo Sebelumnya">
            <input
              required
              type="number"
              min={0}
              value={form.balanceBefore}
              onChange={(e) => setForm((f) => ({ ...f, balanceBefore: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
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
          <FormField label="Tanggal Pengajuan">
            <input
              required
              type="date"
              value={form.requestedAt}
              onChange={(e) => setForm((f) => ({ ...f, requestedAt: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Cuti'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pengajuan Cuti"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus pengajuan cuti{' '}
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
