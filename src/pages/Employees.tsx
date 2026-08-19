import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge, employeeStatusTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeEmployeeId, useData } from '../lib/dataStore'
import { SALARY_RANGES } from '../lib/generateData'
import { exportEmployees } from '../lib/excel'
import { formatDate, initials } from '../lib/utils'
import type { Department, Employee, EmployeeStatus } from '../lib/types'

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]
const LEVELS: Employee['level'][] = ['Staff', 'Supervisor', 'Manager', 'Head', 'Director']
const STATUSES: EmployeeStatus[] = ['Aktif', 'Cuti Panjang', 'Nonaktif']
const LOCATIONS = ['Jakarta HQ', 'Bandung Hub', 'Surabaya Hub', 'Remote']

const BLANK_FORM = {
  name: '',
  email: '',
  phone: '',
  department: DEPARTMENTS[0],
  position: '',
  level: 'Staff' as Employee['level'],
  joinDate: new Date().toISOString().slice(0, 10),
  status: 'Aktif' as EmployeeStatus,
  gender: 'L' as Employee['gender'],
  location: LOCATIONS[0],
  manager: '',
  salaryRange: SALARY_RANGES[0],
}

export default function Employees() {
  const { employees, addEmployees, updateEmployee, deleteEmployee } = useData()
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState<string>('Semua')
  const [status, setStatus] = useState<string>('Semua')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setFormOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      position: emp.position,
      level: emp.level,
      joinDate: emp.joinDate,
      status: emp.status,
      gender: emp.gender,
      location: emp.location,
      manager: emp.manager,
      salaryRange: emp.salaryRange,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateEmployee(editingId, form)
    } else {
      const id = makeEmployeeId()
      addEmployees([
        {
          id,
          employeeCode: id,
          exitDate: null,
          exitReason: null,
          ...form,
        },
      ])
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deleteEmployee(deleteTarget.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchQuery =
        !query ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase())
      const matchDept = department === 'Semua' || e.department === department
      const matchStatus = status === 'Semua' || e.status === status
      return matchQuery && matchDept && matchStatus
    })
  }, [employees, query, department, status])

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (e) => (
        <Link to={`/karyawan/${e.id}`} className="flex items-center gap-3 hover:underline">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: 'var(--series-1)' }}
          >
            {initials(e.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{e.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{e.employeeCode}</div>
          </div>
        </Link>
      ),
      sortValue: (e) => e.name,
    },
    { key: 'department', header: 'Departemen', render: (e) => e.department, sortValue: (e) => e.department },
    { key: 'position', header: 'Posisi', render: (e) => e.position },
    { key: 'level', header: 'Level', render: (e) => e.level, sortValue: (e) => e.level },
    { key: 'joinDate', header: 'Bergabung', render: (e) => formatDate(e.joinDate), sortValue: (e) => e.joinDate },
    { key: 'location', header: 'Lokasi', render: (e) => e.location },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (e) => <Badge tone={employeeStatusTone(e.status)}>{e.status}</Badge>,
      sortValue: (e) => e.status,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEdit(e)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setDeleteTarget(e)}
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
    <AppShell title="Karyawan" subtitle={`${employees.length} total karyawan terdaftar`}>
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, kode, atau email..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 sm:max-w-xs"
              style={{ borderColor: 'var(--border)' }}
            />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            >
              <option>Semua</option>
              <option>Aktif</option>
              <option>Cuti Panjang</option>
              <option>Nonaktif</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              + Tambah Karyawan
            </button>
            <button
              onClick={() => exportEmployees(filtered)}
              className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Export Excel
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={10} emptyLabel="Tidak ada karyawan yang cocok" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Karyawan' : 'Tambah Karyawan'}
        subtitle={editingId ? 'Perbarui data karyawan' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Nama Lengkap">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Telepon">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Posisi">
            <input
              required
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Departemen">
            <select
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value as Department }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Level">
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Employee['level'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Bergabung">
            <input
              required
              type="date"
              value={form.joinDate}
              onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EmployeeStatus }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Jenis Kelamin">
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Employee['gender'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </FormField>
          <FormField label="Lokasi">
            <select
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Manager">
            <input
              value={form.manager}
              onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Rentang Gaji">
            <select
              value={form.salaryRange}
              onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value as Employee['salaryRange'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {SALARY_RANGES.map((r) => (
                <option key={r}>{r}</option>
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Karyawan"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.name}</span> dari
          data karyawan?
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
