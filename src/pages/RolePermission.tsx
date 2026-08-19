import { useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { NAV_GROUPS } from '../lib/nav'
import { classNames } from '../lib/utils'

const MODULES = NAV_GROUPS.map((g) => g.label)
const ACCESS_LEVELS = ['Penuh', 'Terbatas', 'Lihat Saja'] as const

interface Role {
  id: string
  name: string
  description: string
  users: number
  access: (typeof ACCESS_LEVELS)[number]
  modules: string[]
}

const INITIAL_ROLES: Role[] = [
  {
    id: 'ROL-1',
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh modul dan pengaturan sistem',
    users: 4,
    access: 'Penuh',
    modules: MODULES,
  },
  {
    id: 'ROL-2',
    name: 'HR Administrator',
    description: 'Mengelola data karyawan, absensi, cuti, dan payroll',
    users: 6,
    access: 'Penuh',
    modules: ['People', 'Attendance', 'Leave & Time Off', 'Payroll', 'Performance'],
  },
  {
    id: 'ROL-3',
    name: 'People Manager',
    description: 'Menyetujui cuti, lembur, dan menilai kinerja tim',
    users: 32,
    access: 'Terbatas',
    modules: ['Attendance', 'Leave & Time Off', 'Performance'],
  },
  {
    id: 'ROL-4',
    name: 'Finance Staff',
    description: 'Mengakses modul payroll dan reimbursement',
    users: 3,
    access: 'Terbatas',
    modules: ['Payroll'],
  },
  {
    id: 'ROL-5',
    name: 'Karyawan',
    description: 'Mengajukan cuti, lembur, dan reimbursement pribadi',
    users: 133,
    access: 'Lihat Saja',
    modules: ['Leave & Time Off'],
  },
]

let roleIdCounter = INITIAL_ROLES.length

const BLANK_FORM = {
  name: '',
  description: '',
  users: 0,
  access: 'Terbatas' as Role['access'],
  modules: [] as string[],
}

export default function RolePermission() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [view, setView] = useState<'list' | 'matrix'>('list')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingId(role.id)
    setForm({ name: role.name, description: role.description, users: role.users, access: role.access, modules: role.modules })
    setFormOpen(true)
  }

  const toggleModule = (mod: string) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(mod) ? f.modules.filter((m) => m !== mod) : [...f.modules, mod],
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setRoles((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...form } : r)))
    } else {
      roleIdCounter += 1
      setRoles((prev) => [...prev, { id: `ROL-${roleIdCounter}`, ...form }])
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const columns: Column<Role>[] = [
    { key: 'name', header: 'Peran', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'description', header: 'Deskripsi', render: (r) => r.description },
    {
      key: 'modules',
      header: 'Modul',
      render: (r) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {r.modules.map((m) => (
            <span
              key={m}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
              style={{ background: 'var(--page-plane)' }}
            >
              {m}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'users', header: 'Pengguna', align: 'right', render: (r) => r.users, sortValue: (r) => r.users },
    {
      key: 'access',
      header: 'Level Akses',
      align: 'center',
      render: (r) => <Badge tone={r.access === 'Penuh' ? 'good' : r.access === 'Terbatas' ? 'warning' : 'neutral'}>{r.access}</Badge>,
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
    <AppShell title="Role & Permission" subtitle="Kelola peran pengguna dan hak akses ke setiap modul HRIS">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Peran" value={roles.length.toString()} />
        <StatCard label="Total Pengguna" value={roles.reduce((s, r) => s + r.users, 0).toLocaleString('id-ID')} />
        <StatCard label="Akses Penuh" value={roles.filter((r) => r.access === 'Penuh').length.toString()} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setView('list')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={view === 'list' ? { background: 'var(--series-1)', color: '#fff' } : { color: 'var(--text-secondary)' }}
          >
            Daftar Peran
          </button>
          <button
            onClick={() => setView('matrix')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={view === 'matrix' ? { background: 'var(--series-1)', color: '#fff' } : { color: 'var(--text-secondary)' }}
          >
            Matriks Akses
          </button>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--series-1)' }}
        >
          + Tambah Peran
        </button>
      </div>

      {view === 'list' ? (
        <Card className="mt-4">
          <DataTable columns={columns} rows={roles} pageSize={10} />
        </Card>
      ) : (
        <Card className="mt-4" title="Matriks Akses Modul" subtitle="Modul yang dapat diakses oleh setiap peran">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="sticky left-0 whitespace-nowrap bg-[var(--surface-1)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Peran
                  </th>
                  {MODULES.map((mod) => (
                    <th
                      key={mod}
                      className="whitespace-nowrap px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                    >
                      {mod}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--gridline)' }}>
                    <td className="sticky left-0 whitespace-nowrap bg-[var(--surface-1)] px-4 py-3 font-medium text-[var(--text-primary)]">
                      {r.name}
                    </td>
                    {MODULES.map((mod) => {
                      const granted = r.modules.includes(mod)
                      return (
                        <td key={mod} className="px-3 py-3 text-center">
                          <span
                            className={classNames(
                              'inline-flex h-5 w-5 items-center justify-center rounded-full',
                              granted ? '' : 'opacity-30'
                            )}
                            style={{ background: granted ? 'rgba(12,163,12,0.14)' : 'var(--page-plane)' }}
                          >
                            {granted && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--status-good)" strokeWidth="3">
                                <path d="M5 12l5 5L19 8" />
                              </svg>
                            )}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Peran' : 'Tambah Peran'}
        subtitle="Atur nama, level akses, dan modul yang dapat diakses"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="Nama Peran">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Deskripsi">
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jumlah Pengguna">
              <input
                type="number"
                min={0}
                value={form.users}
                onChange={(e) => setForm((f) => ({ ...f, users: Number(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </FormField>
            <FormField label="Level Akses">
              <select
                value={form.access}
                onChange={(e) => setForm((f) => ({ ...f, access: e.target.value as Role['access'] }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                {ACCESS_LEVELS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Modul yang Dapat Diakses">
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
              {MODULES.map((mod) => (
                <label key={mod} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod)}
                    onChange={() => toggleModule(mod)}
                    className="h-3.5 w-3.5 rounded"
                    style={{ accentColor: 'var(--series-1)' }}
                  />
                  {mod}
                </label>
              ))}
            </div>
          </FormField>

          <div className="mt-2 flex justify-end gap-2">
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Peran'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Peran"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus peran <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.name}</span>?
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
