import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { initials } from '../lib/utils'
import type { PerformanceReview, ReviewStage } from '../lib/types'

const STAGES: ReviewStage[] = ['Self Assessment', 'Manager Review', 'Kalibrasi', 'Selesai']

const BLANK_FORM = {
  employeeId: '',
  period: '2026-Q3',
  stage: 'Self Assessment' as ReviewStage,
  selfScore: '' as number | '' ,
  managerScore: '' as number | '',
  finalScore: '' as number | '',
  reviewer: '',
}

function toScoreInput(v: number | null): number | '' {
  return v === null ? '' : v
}

function toScoreValue(v: number | ''): number | null {
  return v === '' ? null : Number(v)
}

export default function PerformanceReviewPage() {
  const { reviews, employees, employeeMap, addReview, updateReview, deleteReview } = useData()
  const periods = useMemo(() => Array.from(new Set(reviews.map((r) => r.period))).sort(), [reviews])
  const [period, setPeriod] = useState(periods[periods.length - 1])
  const [stage, setStage] = useState<'Semua' | ReviewStage>('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<PerformanceReview | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...BLANK_FORM, employeeId: employees[0]?.id ?? '', period: period ?? BLANK_FORM.period })
    setFormOpen(true)
  }

  const openEdit = (r: PerformanceReview) => {
    setEditingId(r.id)
    setForm({
      employeeId: r.employeeId,
      period: r.period,
      stage: r.stage,
      selfScore: toScoreInput(r.selfScore),
      managerScore: toScoreInput(r.managerScore),
      finalScore: toScoreInput(r.finalScore),
      reviewer: r.reviewer,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      employeeId: form.employeeId,
      period: form.period,
      stage: form.stage,
      selfScore: toScoreValue(form.selfScore),
      managerScore: toScoreValue(form.managerScore),
      finalScore: toScoreValue(form.finalScore),
      reviewer: form.reviewer,
    }
    if (editingId) {
      updateReview(editingId, payload)
    } else {
      addReview({ id: makeId('REV'), ...payload })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteReview(deleteTarget.id)
    setDeleteTarget(null)
  }

  const periodReviews = useMemo(() => reviews.filter((r) => r.period === period), [reviews, period])
  const filtered = stage === 'Semua' ? periodReviews : periodReviews.filter((r) => r.stage === stage)

  const completed = periodReviews.filter((r) => r.stage === 'Selesai').length
  const inProgress = periodReviews.length - completed

  const columns: Column<PerformanceReview>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-3)' }}>
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
    { key: 'reviewer', header: 'Reviewer', render: (r) => r.reviewer },
    { key: 'selfScore', header: 'Self Score', align: 'right', render: (r) => r.selfScore ?? '—', sortValue: (r) => r.selfScore ?? -1 },
    { key: 'managerScore', header: 'Manager Score', align: 'right', render: (r) => r.managerScore ?? '—', sortValue: (r) => r.managerScore ?? -1 },
    { key: 'finalScore', header: 'Final Score', align: 'right', render: (r) => (r.finalScore !== null ? <span className="font-semibold">{r.finalScore}</span> : '—'), sortValue: (r) => r.finalScore ?? -1 },
    {
      key: 'stage',
      header: 'Tahapan',
      align: 'center',
      render: (r) => <Badge tone={approvalTone(r.stage)}>{r.stage}</Badge>,
      sortValue: (r) => r.stage,
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
    <AppShell title="Performance Review" subtitle="Siklus penilaian kinerja: self assessment hingga kalibrasi final">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Review" value={periodReviews.length.toLocaleString('id-ID')} />
        <StatCard label="Selesai" value={completed.toLocaleString('id-ID')} positive />
        <StatCard label="Dalam Proses" value={inProgress.toLocaleString('id-ID')} positive={inProgress === 0} />
      </div>
      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as typeof stage)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Review
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Review' : 'Tambah Review'}
        subtitle={editingId ? 'Perbarui data review' : 'Data akan disimpan sebagai data simulasi'}
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
          <FormField label="Reviewer">
            <input
              required
              value={form.reviewer}
              onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tahapan">
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as ReviewStage }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Self Score">
            <input
              type="number"
              value={form.selfScore}
              onChange={(e) => setForm((f) => ({ ...f, selfScore: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Manager Score">
            <input
              type="number"
              value={form.managerScore}
              onChange={(e) => setForm((f) => ({ ...f, managerScore: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Final Score">
            <input
              type="number"
              value={form.finalScore}
              onChange={(e) => setForm((f) => ({ ...f, finalScore: e.target.value === '' ? '' : Number(e.target.value) }))}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Review'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Review"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus review milik{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {deleteTarget ? employeeMap.get(deleteTarget.employeeId)?.name ?? deleteTarget.employeeId : ''}
          </span>
          ?
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
