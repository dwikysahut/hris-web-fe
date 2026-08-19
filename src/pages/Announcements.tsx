import { useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDateTime } from '../lib/utils'
import type { Announcement, Department } from '../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]
const AUDIENCES: Announcement['audience'][] = ['Semua Karyawan', ...DEPARTMENTS]

const BLANK_FORM = {
  title: '',
  body: '',
  audience: 'Semua Karyawan' as Announcement['audience'],
  publishedAt: new Date().toISOString().slice(0, 16),
  pinned: false,
  author: '',
}

export default function Announcements() {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useData()
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.publishedAt < b.publishedAt ? 1 : -1
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditingId(a.id)
    setForm({
      title: a.title,
      body: a.body,
      audience: a.audience,
      publishedAt: a.publishedAt.slice(0, 16),
      pinned: a.pinned,
      author: a.author,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...form, publishedAt: new Date(form.publishedAt).toISOString() }
    if (editingId) {
      updateAnnouncement(editingId, payload)
    } else {
      addAnnouncement({ id: makeId('ANN'), ...payload })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteAnnouncement(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <AppShell title="Pengumuman" subtitle="Informasi dan pemberitahuan resmi dari perusahaan">
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--series-1)' }}
        >
          + Tambah Pengumuman
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {a.pinned && <Badge tone="warning">Disematkan</Badge>}
                  <Badge tone="neutral">{a.audience}</Badge>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{a.body}</p>
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {a.author} · {formatDateTime(a.publishedAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(a)}
                  className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Ubah
                </button>
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Pengumuman' : 'Tambah Pengumuman'}
        subtitle={editingId ? 'Perbarui data pengumuman' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Judul">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Isi Pengumuman">
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </FormField>
          </div>
          <FormField label="Audiens">
            <select
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Announcement['audience'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {AUDIENCES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Penulis">
            <input
              required
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tanggal Publikasi">
            <input
              required
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Sematkan">
            <label className="flex items-center gap-2 pt-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              />
              Sematkan pengumuman ini di atas
            </label>
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pengumuman"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.title}</span>?
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
