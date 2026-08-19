import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate } from '../lib/utils'
import type { DocumentCategory, EmployeeDocument } from '../lib/types'

const CATEGORIES: DocumentCategory[] = ['Kontrak', 'Identitas', 'Sertifikat', 'Slip Gaji', 'Surat Keputusan', 'Lainnya']

function isExpiringSoon(dateStr: string | null) {
  if (!dateStr) return false
  const days = (new Date(dateStr).getTime() - new Date('2026-08-19').getTime()) / 86400000
  return days >= 0 && days <= 60
}

export default function Documents() {
  const { documents, employeeMap, employees, addDocument, updateDocument, deleteDocument } = useData()
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')

  const BLANK_FORM = useMemo(
    () => ({
      employeeId: employees[0]?.id ?? '',
      name: '',
      category: CATEGORIES[0],
      uploadedAt: new Date().toISOString().slice(0, 10),
      fileSize: '',
      expiresAt: '' as string,
    }),
    [employees]
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocument | null>(null)

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const emp = employeeMap.get(d.employeeId)
      const matchCategory = category === 'Semua' || d.category === category
      const matchQuery = !query || emp?.name.toLowerCase().includes(query.toLowerCase()) || d.name.toLowerCase().includes(query.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [documents, category, query, employeeMap])

  const expiringSoon = documents.filter((d) => isExpiringSoon(d.expiresAt)).length

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (doc: EmployeeDocument) => {
    setEditingId(doc.id)
    setForm({
      employeeId: doc.employeeId,
      name: doc.name,
      category: doc.category,
      uploadedAt: doc.uploadedAt,
      fileSize: doc.fileSize,
      expiresAt: doc.expiresAt ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...form, expiresAt: form.expiresAt ? form.expiresAt : null }
    if (editingId) {
      updateDocument(editingId, payload)
    } else {
      addDocument({ id: makeId('DOC'), ...payload })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteDocument(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<EmployeeDocument>[] = [
    {
      key: 'name',
      header: 'Dokumen',
      render: (d) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold"
            style={{ background: 'rgba(42,120,214,0.1)', color: 'var(--series-1)' }}
          >
            {d.category === 'Slip Gaji' ? 'PDF' : 'DOC'}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{d.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{d.fileSize}</div>
          </div>
        </div>
      ),
      sortValue: (d) => d.name,
    },
    {
      key: 'owner',
      header: 'Pemilik',
      render: (d) => employeeMap.get(d.employeeId)?.name ?? '-',
      sortValue: (d) => employeeMap.get(d.employeeId)?.name ?? '',
    },
    { key: 'category', header: 'Kategori', render: (d) => d.category, sortValue: (d) => d.category },
    { key: 'uploadedAt', header: 'Diunggah', render: (d) => formatDate(d.uploadedAt), sortValue: (d) => d.uploadedAt },
    {
      key: 'expiresAt',
      header: 'Kedaluwarsa',
      align: 'center',
      render: (d) =>
        d.expiresAt ? (
          <Badge tone={isExpiringSoon(d.expiresAt) ? 'warning' : 'neutral'}>{formatDate(d.expiresAt)}</Badge>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        ),
      sortValue: (d) => d.expiresAt ?? '',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(d)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(d)}
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
    <AppShell title="Dokumen" subtitle="Arsip dokumen kepegawaian: kontrak, identitas, sertifikat, dan lainnya">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Dokumen" value={documents.length.toLocaleString('id-ID')} />
        <StatCard label="Akan Kedaluwarsa" value={expiringSoon.toLocaleString('id-ID')} positive={expiringSoon === 0} deltaLabel="dalam 60 hari" />
        <StatCard label="Kategori" value={CATEGORIES.length.toString()} />
        <StatCard label="Karyawan Terarsip" value={new Set(documents.map((d) => d.employeeId)).size.toLocaleString('id-ID')} />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama karyawan atau dokumen..."
              className="w-full rounded-lg border px-3 py-2 text-sm sm:max-w-xs"
              style={{ borderColor: 'var(--border)' }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Dokumen
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada dokumen ditemukan" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Dokumen' : 'Tambah Dokumen'}
        subtitle={editingId ? 'Perbarui data dokumen' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Nama Dokumen">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Pemilik">
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DocumentCategory }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ukuran File">
            <input
              required
              placeholder="mis. 1.2 MB"
              value={form.fileSize}
              onChange={(e) => setForm((f) => ({ ...f, fileSize: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tanggal Diunggah">
            <input
              required
              type="date"
              value={form.uploadedAt}
              onChange={(e) => setForm((f) => ({ ...f, uploadedAt: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tanggal Kedaluwarsa (opsional)">
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Dokumen'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Dokumen"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.name}</span> dari
          arsip dokumen?
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
