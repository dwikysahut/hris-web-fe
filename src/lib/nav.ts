export interface NavItem {
  to: string
  label: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Executive Dashboard',
    items: [
      { to: '/', label: 'Overview' },
      { to: '/dashboard/headcount', label: 'Headcount' },
      { to: '/dashboard/turnover', label: 'Turnover' },
      { to: '/dashboard/attendance', label: 'Attendance' },
      { to: '/dashboard/leave', label: 'Leave' },
      { to: '/dashboard/overtime', label: 'Overtime' },
      { to: '/dashboard/payroll', label: 'Payroll Summary' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/karyawan', label: 'Employee Directory' },
      { to: '/struktur-organisasi', label: 'Organization' },
      { to: '/posisi', label: 'Position' },
      { to: '/departemen', label: 'Department' },
      { to: '/status-kepegawaian', label: 'Employment Status' },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { to: '/absensi', label: 'Daily Attendance' },
      { to: '/pemantauan-absensi', label: 'Attendance Monitoring' },
      { to: '/jadwal-shift', label: 'Shift Schedule' },
      { to: '/keterlambatan', label: 'Late / Early Leave' },
      { to: '/ketidakhadiran', label: 'Absence' },
      { to: '/lembur', label: 'Overtime' },
      { to: '/analitik-absensi', label: 'Attendance Analytics' },
    ],
  },
  {
    label: 'Leave & Time Off',
    items: [
      { to: '/cuti', label: 'Leave Request' },
      { to: '/persetujuan-cuti', label: 'Approval' },
      { to: '/saldo-cuti', label: 'Leave Balance' },
      { to: '/kalender-cuti', label: 'Leave Calendar' },
      { to: '/analitik-cuti', label: 'Leave Analytics' },
      { to: '/reimbursement', label: 'Reimbursement' },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { to: '/penggajian', label: 'Payroll' },
      { to: '/struktur-gaji', label: 'Salary' },
      { to: '/tunjangan', label: 'Allowance' },
      { to: '/potongan', label: 'Deduction' },
      { to: '/slip-gaji', label: 'Payslip' },
      { to: '/analitik-payroll', label: 'Payroll Analytics' },
    ],
  },
  {
    label: 'Performance',
    items: [
      { to: '/kinerja', label: 'KPI' },
      { to: '/penilaian-kinerja', label: 'Performance Review' },
      { to: '/goal-objective', label: 'Goal / Objective' },
      { to: '/asesmen', label: 'Assessment' },
      { to: '/analitik-kinerja', label: 'Performance Analytics' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/analitik-people', label: 'People Analytics' },
      { to: '/analitik-absensi', label: 'Attendance Analytics' },
      { to: '/analitik-turnover', label: 'Turnover Analytics' },
      { to: '/analitik-payroll', label: 'Payroll Analytics' },
      { to: '/analitik-kinerja', label: 'Performance Analytics' },
      { to: '/laporan-kustom', label: 'Custom Reports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/manajemen-pengguna', label: 'User Management' },
      { to: '/peran-akses', label: 'Role & Permission' },
      { to: '/workflow', label: 'Workflow' },
      { to: '/data-master', label: 'Master Data' },
      { to: '/log-aktivitas', label: 'Audit Log' },
      { to: '/pengaturan', label: 'System Settings' },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { to: '/rekrutmen', label: 'Rekrutmen' },
      { to: '/pelatihan', label: 'Pelatihan' },
      { to: '/dokumen', label: 'Dokumen' },
      { to: '/pengumuman', label: 'Pengumuman' },
      { to: '/import', label: 'Import & Data Warehouse' },
    ],
  },
]

export const NAV_ITEMS_FLAT: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
