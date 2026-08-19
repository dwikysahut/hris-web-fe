import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'

interface Role {
  id: string
  name: string
  description: string
  users: number
  access: 'Penuh' | 'Terbatas' | 'Lihat Saja'
  modules: string[]
}

const ROLES: Role[] = [
  {
    id: 'ROL-1',
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh modul dan pengaturan sistem',
    users: 4,
    access: 'Penuh',
    modules: ['Semua Modul'],
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
    modules: ['Self Service'],
  },
]

export default function RolePermission() {
  const columns: Column<Role>[] = [
    { key: 'name', header: 'Peran', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'description', header: 'Deskripsi', render: (r) => r.description },
    { key: 'modules', header: 'Modul', render: (r) => <span className="text-xs text-[var(--text-muted)]">{r.modules.join(', ')}</span> },
    { key: 'users', header: 'Pengguna', align: 'right', render: (r) => r.users, sortValue: (r) => r.users },
    {
      key: 'access',
      header: 'Level Akses',
      align: 'center',
      render: (r) => <Badge tone={r.access === 'Penuh' ? 'good' : r.access === 'Terbatas' ? 'warning' : 'neutral'}>{r.access}</Badge>,
    },
  ]

  return (
    <AppShell title="Role & Permission" subtitle="Kelola peran pengguna dan hak akses ke setiap modul HRIS">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Peran" value={ROLES.length.toString()} />
        <StatCard label="Total Pengguna" value={ROLES.reduce((s, r) => s + r.users, 0).toLocaleString('id-ID')} />
        <StatCard label="Akses Penuh" value={ROLES.filter((r) => r.access === 'Penuh').length.toString()} />
      </div>
      <Card className="mt-4">
        <DataTable columns={columns} rows={ROLES} pageSize={10} />
      </Card>
    </AppShell>
  )
}
