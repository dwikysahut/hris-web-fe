import { useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import type { WorkflowConfig, WorkflowStage } from '../lib/types'

const BLANK_FORM = {
  name: '',
  module: '',
  trigger: '',
  stages: [{ name: '', approver: '', slaHours: 24 }] as WorkflowStage[],
  active: true,
}

export default function Workflow() {
  const { workflows, setWorkflowActive, addWorkflow, updateWorkflow, deleteWorkflow } = useData()
  const active = workflows.filter((w) => w.active).length

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowConfig | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (wf: WorkflowConfig) => {
    setEditingId(wf.id)
    setForm({
      name: wf.name,
      module: wf.module,
      trigger: wf.trigger,
      stages: wf.stages.map((s) => ({ ...s })),
      active: wf.active,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateWorkflow(editingId, form)
    } else {
      addWorkflow({ id: makeId('WF'), ...form })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteWorkflow(deleteTarget.id)
    setDeleteTarget(null)
  }

  const updateStage = (index: number, patch: Partial<WorkflowStage>) => {
    setForm((f) => ({
      ...f,
      stages: f.stages.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))
  }

  const removeStage = (index: number) => {
    setForm((f) => ({ ...f, stages: f.stages.filter((_, i) => i !== index) }))
  }

  const addStage = () => {
    setForm((f) => ({ ...f, stages: [...f.stages, { name: '', approver: '', slaHours: 24 }] }))
  }

  return (
    <AppShell title="Workflow" subtitle="Konfigurasi alur persetujuan otomatis untuk setiap modul">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Workflow" value={workflows.length.toString()} />
        <StatCard label="Aktif" value={active.toString()} positive />
        <StatCard label="Nonaktif" value={(workflows.length - active).toString()} />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--series-1)' }}
        >
          + Tambah Workflow
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {workflows.map((wf) => (
          <Card key={wf.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{wf.name}</h3>
                  <Badge tone="neutral">{wf.module}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Trigger: {wf.trigger}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkflowActive(wf.id, !wf.active)}
                  className="rounded-lg px-3.5 py-1.5 text-xs font-medium"
                  style={
                    wf.active
                      ? { background: 'rgba(12,163,12,0.12)', color: 'var(--success-text)' }
                      : { background: 'rgba(11,11,11,0.06)', color: 'var(--text-secondary)' }
                  }
                >
                  {wf.active ? 'Aktif' : 'Nonaktif'}
                </button>
                <button
                  onClick={() => openEdit(wf)}
                  className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Ubah
                </button>
                <button
                  onClick={() => setDeleteTarget(wf)}
                  className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Hapus
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {wf.stages.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-2">
                  <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                    <div className="font-medium text-[var(--text-primary)]">{stage.name}</div>
                    <div className="text-[var(--text-muted)]">
                      {stage.approver} · SLA {stage.slaHours} jam
                    </div>
                  </div>
                  {i < wf.stages.length - 1 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Workflow' : 'Tambah Workflow'}
        subtitle={editingId ? 'Perbarui konfigurasi workflow' : 'Data akan disimpan sebagai data simulasi'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Nama Workflow">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Modul">
            <input
              required
              value={form.module}
              onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Trigger">
            <input
              required
              value={form.trigger}
              onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.active ? 'Aktif' : 'Nonaktif'}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'Aktif' }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Aktif</option>
              <option>Nonaktif</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Tahapan Persetujuan</span>
            <div className="space-y-2">
              {form.stages.map((stage, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
                  <input
                    required
                    placeholder="Nama Tahap"
                    value={stage.name}
                    onChange={(e) => updateStage(i, { name: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <input
                    required
                    placeholder="Approver"
                    value={stage.approver}
                    onChange={(e) => updateStage(i, { approver: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="SLA (jam)"
                    value={stage.slaHours}
                    onChange={(e) => updateStage(i, { slaHours: Number(e.target.value) })}
                    className="w-24 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeStage(i)}
                    disabled={form.stages.length <= 1}
                    className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)] disabled:opacity-40"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStage}
              className="mt-2 rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
              style={{ borderColor: 'var(--border)' }}
            >
              + Tambah Tahap
            </button>
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Workflow'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Workflow"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus workflow <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.name}</span>?
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
