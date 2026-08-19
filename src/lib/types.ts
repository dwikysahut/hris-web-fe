export type Department =
  | 'Engineering'
  | 'Sales'
  | 'Marketing'
  | 'Human Resources'
  | 'Finance'
  | 'Operations'
  | 'Customer Support'

export type EmployeeStatus = 'Aktif' | 'Cuti Panjang' | 'Nonaktif'

export interface Employee {
  id: string
  employeeCode: string
  name: string
  email: string
  phone: string
  department: Department
  position: string
  level: 'Staff' | 'Supervisor' | 'Manager' | 'Head' | 'Director'
  joinDate: string // ISO date
  status: EmployeeStatus
  gender: 'L' | 'P'
  location: string
  manager: string
  salaryBand: 'Band 1' | 'Band 2' | 'Band 3' | 'Band 4' | 'Band 5'
  exitDate: string | null
  exitReason: 'Resign' | 'Kontrak Berakhir' | 'Pemutusan Hubungan Kerja' | 'Pensiun' | null
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha' | 'Cuti' | 'WFH'

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string // ISO date
  status: AttendanceStatus
  checkIn: string | null // HH:mm
  checkOut: string | null // HH:mm
  workHours: number
}

export interface KpiRecord {
  id: string
  employeeId: string
  period: string // YYYY-MM
  productivity: number // 0-100
  quality: number // 0-100
  discipline: number // 0-100
  teamwork: number // 0-100
  initiative: number // 0-100
  target: number // 0-100
  achievement: number // 0-100
  overallScore: number // 0-100
  rating: 'A' | 'B' | 'C' | 'D'
}

export interface ImportLogEntry {
  id: string
  fileName: string
  type: 'Karyawan' | 'Absensi' | 'KPI'
  rowsProcessed: number
  rowsFailed: number
  importedAt: string // ISO datetime
  status: 'Sukses' | 'Sebagian Gagal' | 'Gagal'
}

export type LeaveType = 'Cuti Tahunan' | 'Sakit' | 'Izin' | 'Cuti Melahirkan' | 'Cuti Menikah' | 'Duka Cita'
export type ApprovalStatus = 'Menunggu' | 'Disetujui' | 'Ditolak'

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: ApprovalStatus
  requestedAt: string
  balanceBefore: number
}

export interface ShiftAssignment {
  id: string
  employeeId: string
  date: string
  shift: 'Pagi' | 'Siang' | 'Malam' | 'Libur'
  startTime: string | null
  endTime: string | null
}

export interface OvertimeRequest {
  id: string
  employeeId: string
  date: string
  hours: number
  reason: string
  status: ApprovalStatus
  compensation: 'Uang Lembur' | 'Ganti Hari'
}

export interface PayrollRecord {
  id: string
  employeeId: string
  period: string // YYYY-MM
  basicSalary: number
  allowance: number
  overtimePay: number
  bonus: number
  bpjsKesehatan: number
  bpjsKetenagakerjaan: number
  pph21: number
  otherDeduction: number
  grossPay: number
  netPay: number
  status: 'Draft' | 'Diproses' | 'Dibayar'
  paidAt: string | null
}

export type ClaimCategory = 'Transportasi' | 'Kesehatan' | 'Makan' | 'Komunikasi' | 'Perjalanan Dinas' | 'Lainnya'

export interface ExpenseClaim {
  id: string
  employeeId: string
  category: ClaimCategory
  amount: number
  description: string
  submittedAt: string
  status: ApprovalStatus
}

export interface JobOpening {
  id: string
  title: string
  department: Department
  location: string
  employmentType: 'Full-time' | 'Kontrak' | 'Magang'
  openings: number
  status: 'Dibuka' | 'Ditutup'
  postedAt: string
  applicants: number
}

export type CandidateStage = 'Lamaran Masuk' | 'Screening' | 'Interview' | 'Penawaran' | 'Diterima' | 'Ditolak'

export interface Candidate {
  id: string
  name: string
  jobId: string
  email: string
  stage: CandidateStage
  appliedAt: string
  source: 'LinkedIn' | 'Jobstreet' | 'Referensi Karyawan' | 'Website Karir' | 'Glints'
  score: number
}

export interface TrainingProgram {
  id: string
  title: string
  category: 'Teknis' | 'Kepemimpinan' | 'Soft Skill' | 'Kepatuhan'
  provider: string
  startDate: string
  endDate: string
  quota: number
  enrolled: number
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai'
}

export interface TrainingParticipant {
  id: string
  programId: string
  employeeId: string
  completionPct: number
  score: number | null
  certificate: boolean
}

export type DocumentCategory = 'Kontrak' | 'Identitas' | 'Sertifikat' | 'Slip Gaji' | 'Surat Keputusan' | 'Lainnya'

export interface EmployeeDocument {
  id: string
  employeeId: string
  name: string
  category: DocumentCategory
  uploadedAt: string
  fileSize: string
  expiresAt: string | null
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: 'Semua Karyawan' | Department
  publishedAt: string
  pinned: boolean
  author: string
}

export type GoalStatus = 'Belum Dimulai' | 'Berjalan' | 'Tercapai' | 'Berisiko'

export interface PerformanceGoal {
  id: string
  employeeId: string
  period: string // YYYY-Q# e.g. 2026-Q3
  title: string
  category: 'Individu' | 'Tim' | 'Perusahaan'
  progress: number // 0-100
  status: GoalStatus
  dueDate: string
}

export type ReviewStage = 'Self Assessment' | 'Manager Review' | 'Kalibrasi' | 'Selesai'

export interface PerformanceReview {
  id: string
  employeeId: string
  period: string
  stage: ReviewStage
  selfScore: number | null
  managerScore: number | null
  finalScore: number | null
  reviewer: string
}

export type SystemRole = 'Super Admin' | 'HR Administrator' | 'People Manager' | 'Finance Staff' | 'Karyawan'

export interface SystemUser {
  id: string
  employeeId: string
  username: string
  role: SystemRole
  status: 'Aktif' | 'Nonaktif' | 'Terkunci'
  lastLogin: string | null
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  module: string
  target: string
  timestamp: string
  ipAddress: string
  result: 'Berhasil' | 'Gagal'
}

export interface WorkflowStage {
  name: string
  approver: string
  slaHours: number
}

export interface WorkflowConfig {
  id: string
  name: string
  module: string
  trigger: string
  stages: WorkflowStage[]
  active: boolean
}
