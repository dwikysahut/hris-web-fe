import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate, formatCurrency, initials } from '../lib/utils'
import type { ApprovalStatus, ClaimCategory, ExpenseClaim } from '../lib/types'

const CATEGORIES: ClaimCategory[] = ['Transportasi', 'Kesehatan', 'Makan', 'Komunikasi', 'Perjalanan Dinas', 'Lainnya']

const BLANK_FORM = {
  employeeId: '',
  category: 'Transportasi' as ClaimCategory,
  amount: 0,
  description: '',
  submittedAt: new Date().toISOString().slice(0, 10),
  status: 'Menunggu' as ApprovalStatus,
}

export default function Reimbursement() {
  const { expenseClaims, employees, employeeMap, setClaimStatus, addExpenseClaim, updateExpenseClaim, deleteExpenseClaim } =
    useData()
  const [status, setStatus] = useState<'Semua' | ApprovalStatus>('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<ExpenseClaim | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (c: ExpenseClaim) => {
    setEditingId(c.id)
    setForm({
      employeeId: c.employeeId,
      category: c.category,
      amount: c.amount,
      description: c.description,
      submittedAt: c.submittedAt,
      status: c.status,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateExpenseClaim(editingId, form)
    } else {
      addExpenseClaim({ id: makeId('CLM'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteExpenseClaim(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(
    () => (status === 'Semua' ? expenseClaims : expenseClaims.filter((c) => c.status === status)),
    [expenseClaims, status]
  )

  const pending = expenseClaims.filter((c) => c.status === 'Menunggu')
  const approvedAmount = expenseClaims.filter((c) => c.status === 'Disetujui').reduce((s, c) => s + c.amount, 0)
  const pendingAmount = pending.reduce((s, c) => s + c.amount, 0)

  const columns: Column<ExpenseClaim>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (c) => {
        const emp = employeeMap.get(c.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-2)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? c.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </div>
        )
      },
      sortValue: (c) => employeeMap.get(c.employeeId)?.name ?? '',
    },
    { key: 'category', header: 'Kategori', render: (c) => c.category, sortValue: (c) => c.category },
    { key: 'description', header: 'Deskripsi', render: (c) => c.description },
    {
      key: 'amount',
      header: 'Nominal',
      align: 'right',
      render: (c) => <span className="tabular-nums font-medium">{formatCurrency(c.amount)}</span>,
      sortValue: (c) => c.amount,
    },
    { key: 'submittedAt', header: 'Diajukan', render: (c) => formatDate(c.submittedAt), sortValue: (c) => c.submittedAt },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (c) => <Badge tone={approvalTone(c.status)}>{c.status}</Badge>,
      sortValue: (c) => c.status,
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      render: (c) =>
        c.status === 'Menunggu' ? (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setClaimStatus(c.id, 'Disetujui')}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: 'var(--status-good)' }}
            >
              Setujui
            </button>
            <button
              onClick={() => setClaimStatus(c.id, 'Ditolak')}
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
      render: (c) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(c)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(c)}
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
    <AppShell title="Reimbursement" subtitle="Klaim penggantian biaya operasional karyawan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Klaim" value={expenseClaims.length.toLocaleString('id-ID')} />
        <StatCard label="Menunggu Persetujuan" value={pending.length.toLocaleString('id-ID')} positive={pending.length === 0} />
        <StatCard label="Nominal Menunggu" value={formatCurrency(pendingAmount)} positive={false} />
        <StatCard label="Nominal Disetujui" value={formatCurrency(approvedAmount)} deltaLabel="periode berjalan" />
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
            + Tambah Klaim
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada klaim reimbursement" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Klaim Reimbursement' : 'Tambah Klaim'}
        subtitle={editingId ? 'Perbarui data klaim reimbursement' : 'Data akan disimpan sebagai data simulasi'}
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
          <FormField label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ClaimCategory }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Nominal (Rp)">
            <input
              required
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tanggal Diajukan">
            <input
              required
              type="date"
              value={form.submittedAt}
              onChange={(e) => setForm((f) => ({ ...f, submittedAt: e.target.value }))}
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
          <div className="sm:col-span-2">
            <FormField label="Deskripsi">
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Klaim'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Klaim Reimbursement"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus klaim{' '}
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
