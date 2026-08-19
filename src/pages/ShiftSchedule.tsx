import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { classNames, initials } from '../lib/utils'
import type { Department, ShiftAssignment } from '../lib/types'

const SHIFT_DEPARTMENTS: Department[] = ['Customer Support', 'Operations', 'Engineering']
const SHIFTS: ShiftAssignment['shift'][] = ['Pagi', 'Siang', 'Malam', 'Libur']

const BLANK_FORM = {
  employeeId: '',
  date: new Date().toISOString().slice(0, 10),
  shift: 'Pagi' as ShiftAssignment['shift'],
  startTime: '',
  endTime: '',
}

const SHIFT_STYLE: Record<ShiftAssignment['shift'], { bg: string; fg: string }> = {
  Pagi: { bg: 'rgba(42,120,214,0.12)', fg: 'var(--series-1)' },
  Siang: { bg: 'rgba(237,161,0,0.16)', fg: '#8a5a00' },
  Malam: { bg: 'rgba(74,58,167,0.14)', fg: 'var(--series-7)' },
  Libur: { bg: 'rgba(11,11,11,0.06)', fg: 'var(--text-muted)' },
}

function nextDays(count: number) {
  const today = new Date('2026-08-19')
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export default function ShiftSchedule() {
  const { employees, shiftAssignments, addShiftAssignment, updateShiftAssignment, deleteShiftAssignment } = useData()
  const [department, setDepartment] = useState<Department>('Customer Support')
  const dates = useMemo(() => nextDays(10), [])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<ShiftAssignment | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openCreateForCell = (employeeId: string, date: string) => {
    setEditingId(null)
    setForm({ ...BLANK_FORM, employeeId, date })
    setFormOpen(true)
  }

  const openEdit = (s: ShiftAssignment) => {
    setEditingId(s.id)
    setForm({
      employeeId: s.employeeId,
      date: s.date,
      shift: s.shift,
      startTime: s.startTime ?? '',
      endTime: s.endTime ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      employeeId: form.employeeId,
      date: form.date,
      shift: form.shift,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
    }
    if (editingId) {
      updateShiftAssignment(editingId, payload)
    } else {
      addShiftAssignment({ id: makeId('SHF'), ...payload })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteShiftAssignment(deleteTarget.id)
    setDeleteTarget(null)
    setFormOpen(false)
  }

  const roster = useMemo(
    () => employees.filter((e) => e.status === 'Aktif' && SHIFT_DEPARTMENTS.includes(e.department) && e.department === department),
    [employees, department]
  )

  const byEmployeeDate = useMemo(() => {
    const map = new Map<string, ShiftAssignment>()
    for (const s of shiftAssignments) map.set(`${s.employeeId}|${s.date}`, s)
    return map
  }, [shiftAssignments])

  const todayAssignments = useMemo(() => shiftAssignments.filter((s) => s.date === '2026-08-19'), [shiftAssignments])
  const counts = useMemo(() => {
    const c = { Pagi: 0, Siang: 0, Malam: 0, Libur: 0 }
    for (const s of todayAssignments) c[s.shift] += 1
    return c
  }, [todayAssignments])

  return (
    <AppShell title="Jadwal & Shift" subtitle="Penjadwalan shift kerja untuk tim operasional 24/7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Shift Pagi Hari Ini" value={counts.Pagi.toLocaleString('id-ID')} />
        <StatCard label="Shift Siang Hari Ini" value={counts.Siang.toLocaleString('id-ID')} />
        <StatCard label="Shift Malam Hari Ini" value={counts.Malam.toLocaleString('id-ID')} />
        <StatCard label="Libur Hari Ini" value={counts.Libur.toLocaleString('id-ID')} />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Roster 10 Hari</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">19–28 Agustus 2026</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {SHIFT_DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['Pagi', 'Siang', 'Malam', 'Libur'] as const).map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: SHIFT_STYLE[s].bg, color: SHIFT_STYLE[s].fg }}>
                  {s}
                </span>
              ))}
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              + Tambah Shift
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-[var(--text-muted)]">Klik sel jadwal pada tabel untuk mengubah atau menghapus shift.</p>

        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="sticky left-0 z-10 whitespace-nowrap bg-[var(--surface-1)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Karyawan
                </th>
                {dates.map((d) => (
                  <th key={d} className="whitespace-nowrap px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((emp) => (
                <tr key={emp.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="sticky left-0 z-10 bg-[var(--surface-1)] px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                        style={{ background: 'var(--series-1)' }}
                      >
                        {initials(emp.name)}
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium">{emp.name}</span>
                    </div>
                  </td>
                  {dates.map((d) => {
                    const assignment = byEmployeeDate.get(`${emp.id}|${d}`)
                    const shift = assignment?.shift ?? 'Libur'
                    return (
                      <td key={d} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => (assignment ? openEdit(assignment) : openCreateForCell(emp.id, d))}
                          className={classNames('inline-block w-14 rounded-md py-1 text-xs font-medium hover:opacity-75')}
                          style={{ background: SHIFT_STYLE[shift].bg, color: SHIFT_STYLE[shift].fg }}
                        >
                          {shift}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={dates.length + 1} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Tidak ada karyawan pada departemen ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Shift' : 'Tambah Shift'}
        subtitle={editingId ? 'Perbarui jadwal shift karyawan' : 'Data akan disimpan sebagai data simulasi'}
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
          <FormField label="Shift">
            <select
              value={form.shift}
              onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as ShiftAssignment['shift'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {SHIFTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <div />
          <FormField label="Jam Mulai">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Jam Selesai">
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>

          <div className="mt-2 flex items-center justify-between gap-2 sm:col-span-2">
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  const current = shiftAssignments.find((s) => s.id === editingId)
                  if (current) setDeleteTarget(current)
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--status-critical)]"
                style={{ borderColor: 'var(--border)' }}
              >
                Hapus
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
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
                {editingId ? 'Simpan Perubahan' : 'Tambah Shift'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Shift"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus jadwal shift{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {employees.find((e) => e.id === deleteTarget?.employeeId)?.name ?? deleteTarget?.employeeId}
          </span>{' '}
          pada tanggal {deleteTarget?.date}?
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
