import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDateTime, initials } from '../lib/utils'
import type { SystemRole, SystemUser } from '../lib/types'

const ROLES: SystemRole[] = ['Super Admin', 'HR Administrator', 'People Manager', 'Finance Staff', 'Karyawan']
const STATUSES: SystemUser['status'][] = ['Aktif', 'Nonaktif', 'Terkunci']

const BLANK_FORM = {
  employeeId: '',
  username: '',
  role: 'Karyawan' as SystemRole,
  status: 'Aktif' as SystemUser['status'],
}

export default function UserManagement() {
  const { users, employees, employeeMap, setUserStatus, addUser, updateUser, deleteUser } = useData()
  const [role, setRole] = useState<'Semua' | SystemRole>('Semua')
  const [query, setQuery] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...BLANK_FORM, employeeId: employees[0]?.id ?? '' })
    setFormOpen(true)
  }

  const openEdit = (u: SystemUser) => {
    setEditingId(u.id)
    setForm({
      employeeId: u.employeeId,
      username: u.username,
      role: u.role,
      status: u.status,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateUser(editingId, form)
    } else {
      addUser({
        id: makeId('USR'),
        ...form,
        lastLogin: null,
        createdAt: new Date().toISOString(),
      })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteUser(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (role === 'Semua' || u.role === role) &&
          (!query || employeeMap.get(u.employeeId)?.name.toLowerCase().includes(query.toLowerCase()) || u.username.includes(query.toLowerCase()))
      ),
    [users, role, query, employeeMap]
  )

  const active = users.filter((u) => u.status === 'Aktif').length
  const locked = users.filter((u) => u.status === 'Terkunci').length

  const columns: Column<SystemUser>[] = [
    {
      key: 'name',
      header: 'Pengguna',
      render: (u) => {
        const emp = employeeMap.get(u.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-7)' }}>
              {initials(emp?.name ?? u.username)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? u.username}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">@{u.username}</div>
            </div>
          </div>
        )
      },
      sortValue: (u) => employeeMap.get(u.employeeId)?.name ?? '',
    },
    { key: 'role', header: 'Peran', render: (u) => u.role, sortValue: (u) => u.role },
    { key: 'lastLogin', header: 'Login Terakhir', render: (u) => (u.lastLogin ? formatDateTime(u.lastLogin) : '—'), sortValue: (u) => u.lastLogin ?? '' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => <Badge tone={u.status === 'Aktif' ? 'good' : u.status === 'Terkunci' ? 'critical' : 'neutral'}>{u.status}</Badge>,
      sortValue: (u) => u.status,
    },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      render: (u) => (
        <button
          onClick={() => setUserStatus(u.id, u.status === 'Aktif' ? 'Nonaktif' : 'Aktif')}
          className="rounded-md border px-2.5 py-1 text-xs font-medium"
          style={{ borderColor: 'var(--border)' }}
        >
          {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(u)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(u)}
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
    <AppShell title="User Management" subtitle="Kelola akun pengguna sistem HRIS">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Pengguna" value={users.length.toLocaleString('id-ID')} />
        <StatCard label="Aktif" value={active.toLocaleString('id-ID')} positive />
        <StatCard label="Terkunci" value={locked.toLocaleString('id-ID')} positive={locked === 0} />
      </div>
      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau username..."
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Pengguna
          </button>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Pengguna' : 'Tambah Pengguna'}
        subtitle={editingId ? 'Perbarui data pengguna' : 'Data akan disimpan sebagai data simulasi'}
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
          <FormField label="Username">
            <input
              required
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Peran">
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as SystemRole }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SystemUser['status'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pengguna"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus pengguna{' '}
          <span className="font-medium text-[var(--text-primary)]">@{deleteTarget?.username}</span> dari data pengguna?
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
