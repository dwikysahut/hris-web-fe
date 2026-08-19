import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { initials } from '../lib/utils'
import type { GoalStatus, PerformanceGoal } from '../lib/types'

const STATUSES: GoalStatus[] = ['Berjalan', 'Tercapai', 'Berisiko', 'Belum Dimulai']
const CATEGORIES: PerformanceGoal['category'][] = ['Individu', 'Tim', 'Perusahaan']

function statusTone(status: GoalStatus) {
  switch (status) {
    case 'Tercapai':
      return 'good' as const
    case 'Berjalan':
      return 'neutral' as const
    case 'Berisiko':
      return 'critical' as const
    default:
      return 'warning' as const
  }
}

const BLANK_FORM = {
  employeeId: '',
  period: '2026-Q3',
  title: '',
  category: 'Individu' as PerformanceGoal['category'],
  progress: 0,
  status: 'Belum Dimulai' as GoalStatus,
  dueDate: new Date().toISOString().slice(0, 10),
}

export default function GoalObjective() {
  const { goals, employees, employeeMap, addGoal, updateGoal, deleteGoal } = useData()
  const [status, setStatus] = useState<'Semua' | GoalStatus>('Semua')
  const [category, setCategory] = useState<'Semua' | 'Individu' | 'Tim' | 'Perusahaan'>('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<PerformanceGoal | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...BLANK_FORM, employeeId: employees[0]?.id ?? '' })
    setFormOpen(true)
  }

  const openEdit = (g: PerformanceGoal) => {
    setEditingId(g.id)
    setForm({
      employeeId: g.employeeId,
      period: g.period,
      title: g.title,
      category: g.category,
      progress: g.progress,
      status: g.status,
      dueDate: g.dueDate,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateGoal(editingId, form)
    } else {
      addGoal({ id: makeId('GOAL'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteGoal(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(
    () => goals.filter((g) => (status === 'Semua' || g.status === status) && (category === 'Semua' || g.category === category)),
    [goals, status, category]
  )

  const counts = useMemo(() => {
    const map = new Map<GoalStatus, number>()
    for (const s of STATUSES) map.set(s, 0)
    for (const g of goals) map.set(g.status, (map.get(g.status) ?? 0) + 1)
    return map
  }, [goals])

  const avgProgress = goals.length ? goals.reduce((s, g) => s + g.progress, 0) / goals.length : 0

  return (
    <AppShell title="Goal / Objective" subtitle="OKR karyawan, tim, dan perusahaan — periode 2026-Q3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Goal" value={goals.length.toLocaleString('id-ID')} />
        <StatCard label="Tercapai" value={(counts.get('Tercapai') ?? 0).toLocaleString('id-ID')} positive />
        <StatCard label="Berisiko" value={(counts.get('Berisiko') ?? 0).toLocaleString('id-ID')} positive={false} />
        <StatCard label="Rata-rata Progress" value={`${avgProgress.toFixed(0)}%`} />
      </div>

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
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              <option>Individu</option>
              <option>Tim</option>
              <option>Perusahaan</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Goal
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 30).map((g) => {
            const emp = employeeMap.get(g.employeeId)
            return (
              <div key={g.id} className="rounded-lg border p-3.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={statusTone(g.status)}>{g.status}</Badge>
                  <span className="text-xs text-[var(--text-muted)]">{g.category}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{g.title}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: 'var(--series-1)' }}>
                    {initials(emp?.name ?? '-')}
                  </div>
                  <span className="truncate text-xs text-[var(--text-muted)]">{emp?.name ?? g.employeeId}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Progress</span>
                    <span className="tabular-nums">{g.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--page-plane)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${g.progress}%`, background: g.status === 'Berisiko' ? 'var(--status-critical)' : 'var(--series-1)' }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(g)}
                    className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => setDeleteTarget(g)}
                    className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Goal' : 'Tambah Goal'}
        subtitle={editingId ? 'Perbarui data goal' : 'Data akan disimpan sebagai data simulasi'}
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
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Periode">
            <input
              required
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Judul Goal">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm sm:col-span-2"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PerformanceGoal['category'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as GoalStatus }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Progress (%)">
            <input
              required
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Batas Waktu">
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Goal'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Goal"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus goal <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.title}</span>?
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
