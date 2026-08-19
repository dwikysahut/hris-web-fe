import { fakerID_ID as faker } from '@faker-js/faker'
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  AuditLogEntry,
  ClaimCategory,
  Department,
  DocumentCategory,
  Employee,
  EmployeeDocument,
  ExpenseClaim,
  GoalStatus,
  ImportLogEntry,
  KpiRecord,
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  PayrollRecord,
  PerformanceGoal,
  PerformanceReview,
  ReviewStage,
  ShiftAssignment,
  SystemRole,
  SystemUser,
  TrainingParticipant,
  TrainingProgram,
  WorkflowConfig,
} from './types'

faker.seed(2026)

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]

const POSITIONS: Record<Department, string[]> = {
  Engineering: ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Data Engineer', 'Engineering Manager'],
  Sales: ['Sales Executive', 'Account Manager', 'Sales Manager', 'Business Development'],
  Marketing: ['Marketing Specialist', 'Content Strategist', 'SEO Specialist', 'Marketing Manager'],
  'Human Resources': ['HR Generalist', 'Recruiter', 'People Partner', 'HR Manager'],
  Finance: ['Finance Analyst', 'Accountant', 'Tax Specialist', 'Finance Manager'],
  Operations: ['Operations Analyst', 'Supply Chain Officer', 'Operations Manager'],
  'Customer Support': ['Support Agent', 'Customer Success', 'Support Team Lead'],
}

const LEVELS: Employee['level'][] = ['Staff', 'Supervisor', 'Manager', 'Head', 'Director']
const LOCATIONS = ['Jakarta HQ', 'Bandung Hub', 'Surabaya Hub', 'Remote']
export const SALARY_RANGES: Employee['salaryRange'][] = [
  'Rp 6.500.000 – Rp 8.500.000',
  'Rp 10.000.000 – Rp 13.500.000',
  'Rp 16.000.000 – Rp 20.000.000',
  'Rp 24.000.000 – Rp 30.000.000',
  'Rp 38.000.000 – Rp 46.000.000',
]

function pad(n: number, len = 4) {
  return String(n).padStart(len, '0')
}

function rollLevel(): Employee['level'] {
  const roll = faker.number.int({ min: 1, max: 100 })
  if (roll <= 3) return 'Director'
  if (roll <= 9) return 'Head'
  if (roll <= 22) return 'Manager'
  if (roll <= 42) return 'Supervisor'
  return 'Staff'
}

export function generateEmployees(count = 140): Employee[] {
  const employees: Employee[] = []
  const managerPool: string[] = ['Budi Santoso', 'Siti Rahayu', 'Andi Wijaya', 'Dewi Lestari', 'Rudi Hartono']

  for (let i = 1; i <= count; i++) {
    const gender: Employee['gender'] = faker.number.int({ min: 0, max: 1 }) === 0 ? 'L' : 'P'
    const firstName = gender === 'L' ? faker.person.firstName('male') : faker.person.firstName('female')
    const lastName = faker.person.lastName()
    const name = `${firstName} ${lastName}`
    const department = DEPARTMENTS[i % DEPARTMENTS.length]
    const level = rollLevel()
    const position =
      level === 'Director'
        ? `Director of ${department}`
        : faker.helpers.arrayElement(POSITIONS[department])
    const joinDate = faker.date.between({ from: '2016-01-01', to: '2026-06-01' })
    const statusRoll = faker.number.int({ min: 1, max: 100 })
    const status: Employee['status'] = statusRoll > 96 ? 'Nonaktif' : statusRoll > 92 ? 'Cuti Panjang' : 'Aktif'

    let exitDate: string | null = null
    let exitReason: Employee['exitReason'] = null
    if (status === 'Nonaktif') {
      const exit = faker.date.between({ from: '2025-09-01', to: '2026-08-19' })
      exitDate = exit.toISOString().slice(0, 10)
      exitReason = faker.helpers.arrayElement(['Resign', 'Resign', 'Kontrak Berakhir', 'Pemutusan Hubungan Kerja', 'Pensiun'])
    }

    employees.push({
      id: `EMP-${pad(i)}`,
      employeeCode: `ADW-${pad(i)}`,
      name,
      email: `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') + '@office.co.id',
      phone: faker.phone.number({ style: 'international' }),
      department,
      position,
      level,
      joinDate: joinDate.toISOString().slice(0, 10),
      status,
      gender,
      location: faker.helpers.arrayElement(LOCATIONS),
      manager: faker.helpers.arrayElement(managerPool),
      salaryRange: SALARY_RANGES[Math.min(LEVELS.indexOf(level), SALARY_RANGES.length - 1)],
      exitDate,
      exitReason,
    })
  }
  return employees
}

const STATUS_WEIGHTS: [AttendanceStatus, number][] = [
  ['Hadir', 74],
  ['WFH', 10],
  ['Terlambat', 8],
  ['Izin', 3],
  ['Sakit', 2.5],
  ['Cuti', 2],
  ['Alpha', 0.5],
]

function rollAttendanceStatus(): AttendanceStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = faker.number.float({ min: 0, max: total })
  for (const [status, weight] of STATUS_WEIGHTS) {
    if (r < weight) return status
    r -= weight
  }
  return 'Hadir'
}

function isWeekend(d: Date) {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function generateAttendance(employees: Employee[], days = 90): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = new Date('2026-08-19')
  let counter = 1

  for (const emp of employees) {
    if (emp.status === 'Nonaktif') continue
    for (let d = days; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      if (isWeekend(date)) continue
      if (new Date(emp.joinDate) > date) continue

      const status = rollAttendanceStatus()
      let checkIn: string | null = null
      let checkOut: string | null = null
      let workHours = 0

      if (status === 'Hadir' || status === 'WFH') {
        const inHour = 8
        const inMin = faker.number.int({ min: 0, max: 20 })
        checkIn = `${pad(inHour, 2)}:${pad(inMin, 2)}`
        const outHour = 17
        const outMin = faker.number.int({ min: 0, max: 45 })
        checkOut = `${pad(outHour, 2)}:${pad(outMin, 2)}`
        workHours = 8 + faker.number.float({ min: -0.3, max: 1.2, fractionDigits: 1 })
      } else if (status === 'Terlambat') {
        const inHour = 9
        const inMin = faker.number.int({ min: 5, max: 55 })
        checkIn = `${pad(inHour, 2)}:${pad(inMin, 2)}`
        checkOut = `17:${pad(faker.number.int({ min: 0, max: 30 }), 2)}`
        workHours = 7 + faker.number.float({ min: -0.5, max: 0.5, fractionDigits: 1 })
      }

      records.push({
        id: `ATT-${pad(counter++, 6)}`,
        employeeId: emp.id,
        date: date.toISOString().slice(0, 10),
        status,
        checkIn,
        checkOut,
        workHours: Math.max(0, Number(workHours.toFixed(1))),
      })
    }
  }
  return records
}

function monthsBack(count: number): string[] {
  const out: string[] = []
  const base = new Date('2026-08-01')
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setMonth(d.getMonth() - i)
    out.push(d.toISOString().slice(0, 7))
  }
  return out
}

function ratingFor(score: number): KpiRecord['rating'] {
  if (score >= 88) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

export function generateKpi(employees: Employee[], monthCount = 6): KpiRecord[] {
  const records: KpiRecord[] = []
  const periods = monthsBack(monthCount)
  let counter = 1

  for (const emp of employees) {
    if (emp.status === 'Nonaktif') continue
    const baseline = faker.number.int({ min: 58, max: 92 })
    for (const period of periods) {
      if (new Date(emp.joinDate) > new Date(period + '-28')) continue
      const drift = faker.number.int({ min: -6, max: 6 })
      const productivity = clamp(baseline + drift + faker.number.int({ min: -5, max: 5 }))
      const quality = clamp(baseline + drift + faker.number.int({ min: -5, max: 5 }))
      const discipline = clamp(baseline + drift + faker.number.int({ min: -8, max: 8 }))
      const teamwork = clamp(baseline + drift + faker.number.int({ min: -5, max: 5 }))
      const initiative = clamp(baseline + drift + faker.number.int({ min: -7, max: 7 }))
      const target = 100
      const overallScore = Math.round(
        productivity * 0.3 + quality * 0.25 + discipline * 0.15 + teamwork * 0.15 + initiative * 0.15
      )
      const achievement = clamp(overallScore + faker.number.int({ min: -4, max: 6 }))

      records.push({
        id: `KPI-${pad(counter++, 6)}`,
        employeeId: emp.id,
        period,
        productivity,
        quality,
        discipline,
        teamwork,
        initiative,
        target,
        achievement,
        overallScore,
        rating: ratingFor(overallScore),
      })
    }
  }
  return records
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function generateImportLog(): ImportLogEntry[] {
  return [
    {
      id: 'LOG-0003',
      fileName: 'absensi_agustus_2026.xlsx',
      type: 'Absensi',
      rowsProcessed: 2840,
      rowsFailed: 0,
      importedAt: '2026-08-18T09:12:00',
      status: 'Sukses',
    },
    {
      id: 'LOG-0002',
      fileName: 'kpi_q2_2026.xlsx',
      type: 'KPI',
      rowsProcessed: 134,
      rowsFailed: 6,
      importedAt: '2026-07-02T14:45:00',
      status: 'Sebagian Gagal',
    },
    {
      id: 'LOG-0001',
      fileName: 'data_karyawan_baru.xlsx',
      type: 'Karyawan',
      rowsProcessed: 18,
      rowsFailed: 0,
      importedAt: '2026-06-11T10:30:00',
      status: 'Sukses',
    },
  ]
}

const LEAVE_REASONS: Record<LeaveType, string[]> = {
  'Cuti Tahunan': ['Liburan keluarga', 'Pulang kampung', 'Istirahat pribadi', 'Acara keluarga'],
  Sakit: ['Demam', 'Perawatan dokter', 'Pemulihan pasca operasi kecil', 'Kontrol kesehatan'],
  Izin: ['Urusan keluarga', 'Mengurus dokumen', 'Acara sekolah anak', 'Kepentingan mendadak'],
  'Cuti Melahirkan': ['Persalinan'],
  'Cuti Menikah': ['Pernikahan'],
  'Duka Cita': ['Kedukaan keluarga'],
}

function randomStatus(): 'Menunggu' | 'Disetujui' | 'Ditolak' {
  const r = faker.number.int({ min: 1, max: 100 })
  if (r <= 65) return 'Disetujui'
  if (r <= 85) return 'Menunggu'
  return 'Ditolak'
}

const LEAVE_TYPE_WEIGHTS: [LeaveType, number][] = [
  ['Cuti Tahunan', 55],
  ['Sakit', 20],
  ['Izin', 16],
  ['Cuti Menikah', 5],
  ['Duka Cita', 3],
  ['Cuti Melahirkan', 1],
]

function rollLeaveType(): LeaveType {
  const total = LEAVE_TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = faker.number.float({ min: 0, max: total })
  for (const [type, weight] of LEAVE_TYPE_WEIGHTS) {
    if (r < weight) return type
    r -= weight
  }
  return 'Cuti Tahunan'
}

export function generateLeaveRequests(employees: Employee[], count = 70): LeaveRequest[] {
  const active = employees.filter((e) => e.status !== 'Nonaktif')
  const requests: LeaveRequest[] = []
  for (let i = 1; i <= count; i++) {
    const emp = faker.helpers.arrayElement(active)
    const type = rollLeaveType()
    const start = faker.date.between({ from: '2026-06-01', to: '2026-09-15' })
    const days =
      type === 'Cuti Melahirkan' ? 90 : type === 'Cuti Menikah' ? 3 : faker.number.int({ min: 1, max: 5 })
    const end = new Date(start)
    end.setDate(end.getDate() + days - 1)
    const requestedAt = new Date(start)
    requestedAt.setDate(requestedAt.getDate() - faker.number.int({ min: 1, max: 10 }))

    requests.push({
      id: `LV-${pad(i, 5)}`,
      employeeId: emp.id,
      type,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      days,
      reason: faker.helpers.arrayElement(LEAVE_REASONS[type]),
      status: randomStatus(),
      requestedAt: requestedAt.toISOString(),
      balanceBefore: faker.number.int({ min: 3, max: 12 }),
    })
  }
  return requests.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1))
}

const SHIFT_DEPARTMENTS: Department[] = ['Customer Support', 'Operations', 'Engineering']
const SHIFT_TIMES: Record<'Pagi' | 'Siang' | 'Malam', [string, string]> = {
  Pagi: ['06:00', '14:00'],
  Siang: ['14:00', '22:00'],
  Malam: ['22:00', '06:00'],
}

export function generateShiftAssignments(employees: Employee[], days = 14): ShiftAssignment[] {
  const pool = employees.filter((e) => e.status === 'Aktif' && SHIFT_DEPARTMENTS.includes(e.department))
  const assignments: ShiftAssignment[] = []
  const today = new Date('2026-08-19')
  let counter = 1

  for (const emp of pool) {
    for (let d = -3; d < days; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      const roll = faker.number.int({ min: 1, max: 100 })
      const shift: ShiftAssignment['shift'] =
        roll <= 12 ? 'Libur' : roll <= 45 ? 'Pagi' : roll <= 78 ? 'Siang' : 'Malam'
      const times = shift === 'Libur' ? [null, null] : SHIFT_TIMES[shift]
      assignments.push({
        id: `SHF-${pad(counter++, 6)}`,
        employeeId: emp.id,
        date: date.toISOString().slice(0, 10),
        shift,
        startTime: times[0],
        endTime: times[1],
      })
    }
  }
  return assignments
}

export function generateOvertimeRequests(employees: Employee[], count = 55): OvertimeRequest[] {
  const active = employees.filter((e) => e.status !== 'Nonaktif')
  const reasons = ['Penutupan bulanan', 'Rilis produk', 'Deadline klien', 'Persiapan audit', 'Backlog tiket support', 'Event perusahaan']
  const requests: OvertimeRequest[] = []
  for (let i = 1; i <= count; i++) {
    const emp = faker.helpers.arrayElement(active)
    const date = faker.date.between({ from: '2026-07-15', to: '2026-08-19' })
    requests.push({
      id: `OT-${pad(i, 5)}`,
      employeeId: emp.id,
      date: date.toISOString().slice(0, 10),
      hours: faker.number.int({ min: 1, max: 5 }),
      reason: faker.helpers.arrayElement(reasons),
      status: randomStatus(),
      compensation: faker.number.int({ min: 0, max: 1 }) === 0 ? 'Uang Lembur' : 'Ganti Hari',
    })
  }
  return requests.sort((a, b) => (a.date < b.date ? 1 : -1))
}

const BASIC_SALARY_BY_LEVEL: Record<Employee['level'], number> = {
  Staff: 7500000,
  Supervisor: 11500000,
  Manager: 18000000,
  Head: 27000000,
  Director: 42000000,
}

export function generatePayroll(employees: Employee[], monthCount = 3): PayrollRecord[] {
  const periods = monthsBack(monthCount)
  const records: PayrollRecord[] = []
  let counter = 1

  for (const emp of employees) {
    if (emp.status === 'Nonaktif') continue
    const basicSalary = BASIC_SALARY_BY_LEVEL[emp.level] + faker.number.int({ min: -300000, max: 500000 })
    for (const period of periods) {
      if (new Date(emp.joinDate) > new Date(period + '-28')) continue
      const allowance = Math.round(basicSalary * 0.15)
      const overtimePay = faker.number.int({ min: 0, max: 6 }) * 150000
      const bonus = faker.number.int({ min: 1, max: 100 }) > 85 ? Math.round(basicSalary * 0.5) : 0
      const bpjsKesehatan = Math.round(basicSalary * 0.01)
      const bpjsKetenagakerjaan = Math.round(basicSalary * 0.02)
      const grossPay = basicSalary + allowance + overtimePay + bonus
      const pph21 = Math.round(grossPay * (emp.level === 'Staff' ? 0.02 : emp.level === 'Supervisor' ? 0.04 : 0.07))
      const otherDeduction = faker.number.int({ min: 1, max: 100 }) > 80 ? faker.number.int({ min: 50000, max: 300000 }) : 0
      const netPay = grossPay - bpjsKesehatan - bpjsKetenagakerjaan - pph21 - otherDeduction
      const isPast = period < '2026-08'

      records.push({
        id: `PAY-${pad(counter++, 6)}`,
        employeeId: emp.id,
        period,
        basicSalary,
        allowance,
        overtimePay,
        bonus,
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        pph21,
        otherDeduction,
        grossPay,
        netPay,
        status: isPast ? 'Dibayar' : 'Diproses',
        paidAt: isPast ? `${period}-27T10:00:00` : null,
      })
    }
  }
  return records
}

const CLAIM_CATEGORIES: ClaimCategory[] = ['Transportasi', 'Kesehatan', 'Makan', 'Komunikasi', 'Perjalanan Dinas', 'Lainnya']
const CLAIM_RANGE: Record<ClaimCategory, [number, number]> = {
  Transportasi: [50000, 400000],
  Kesehatan: [100000, 2000000],
  Makan: [30000, 250000],
  Komunikasi: [50000, 300000],
  'Perjalanan Dinas': [500000, 5000000],
  Lainnya: [50000, 800000],
}

const CLAIM_DESCRIPTIONS: Record<ClaimCategory, string[]> = {
  Transportasi: ['Ojek online ke kantor klien', 'Taksi menuju bandara', 'Bensin kunjungan lapangan', 'Parkir & tol perjalanan dinas'],
  Kesehatan: ['Konsultasi dokter umum', 'Obat resep dokter', 'Kacamata sesuai polis', 'Pemeriksaan kesehatan tahunan'],
  Makan: ['Makan siang rapat klien', 'Konsumsi lembur tim', 'Makan malam kunjungan kantor cabang', 'Konsumsi rapat divisi'],
  Komunikasi: ['Pulsa & kuota internet bulanan', 'Paket data kerja lapangan', 'Biaya telepon klien luar kota'],
  'Perjalanan Dinas': ['Tiket pesawat Jakarta–Surabaya', 'Hotel kunjungan kantor cabang', 'Akomodasi pelatihan eksternal', 'Tiket kereta perjalanan dinas'],
  Lainnya: ['Perlengkapan kerja tambahan', 'Biaya cetak dokumen klien', 'Sewa venue acara tim'],
}

export function generateExpenseClaims(employees: Employee[], count = 60): ExpenseClaim[] {
  const active = employees.filter((e) => e.status !== 'Nonaktif')
  const claims: ExpenseClaim[] = []
  for (let i = 1; i <= count; i++) {
    const emp = faker.helpers.arrayElement(active)
    const category = faker.helpers.arrayElement(CLAIM_CATEGORIES)
    const [min, max] = CLAIM_RANGE[category]
    const submittedAt = faker.date.between({ from: '2026-07-01', to: '2026-08-19' })
    claims.push({
      id: `CLM-${pad(i, 5)}`,
      employeeId: emp.id,
      category,
      amount: Math.round(faker.number.int({ min, max }) / 1000) * 1000,
      description: faker.helpers.arrayElement(CLAIM_DESCRIPTIONS[category]),
      submittedAt: submittedAt.toISOString(),
      status: randomStatus(),
    })
  }
  return claims.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
}

export function generateTrainingPrograms(count = 9): TrainingProgram[] {
  const catalog: { title: string; category: TrainingProgram['category']; provider: string }[] = [
    { title: 'Advanced React & TypeScript', category: 'Teknis', provider: 'Dicoding' },
    { title: 'Leadership Fundamentals', category: 'Kepemimpinan', provider: 'Prasmul-ELI' },
    { title: 'Effective Communication', category: 'Soft Skill', provider: 'Internal HR' },
    { title: 'K3 & Keselamatan Kerja', category: 'Kepatuhan', provider: 'Kemnaker' },
    { title: 'Data Analytics with SQL', category: 'Teknis', provider: 'DQLab' },
    { title: 'Manajerial untuk Supervisor Baru', category: 'Kepemimpinan', provider: 'Internal HR' },
    { title: 'Customer Service Excellence', category: 'Soft Skill', provider: 'Internal HR' },
    { title: 'Etika Bisnis & Anti Korupsi', category: 'Kepatuhan', provider: 'Internal HR' },
    { title: 'Cloud & DevOps Essentials', category: 'Teknis', provider: 'AWS Training' },
  ]
  const today = new Date('2026-08-19')
  const START_OFFSET_DAYS = [-70, -55, -40, -30, -20, -8, -2, 10, 25]
  return catalog.slice(0, count).map((c, i) => {
    const start = new Date(today)
    start.setDate(start.getDate() + (START_OFFSET_DAYS[i] ?? faker.number.int({ min: -60, max: 30 })))
    const end = new Date(start)
    end.setDate(end.getDate() + faker.number.int({ min: 1, max: 5 }))
    const quota = faker.number.int({ min: 15, max: 40 })
    const status: TrainingProgram['status'] = start > today ? 'Terjadwal' : end < today ? 'Selesai' : 'Berlangsung'
    return {
      id: `TRN-${pad(i + 1, 4)}`,
      title: c.title,
      category: c.category,
      provider: c.provider,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      quota,
      enrolled: faker.number.int({ min: Math.round(quota * 0.4), max: quota }),
      status,
    }
  })
}

export function generateTrainingParticipants(programs: TrainingProgram[], employees: Employee[]): TrainingParticipant[] {
  const active = employees.filter((e) => e.status === 'Aktif')
  const participants: TrainingParticipant[] = []
  let counter = 1
  for (const program of programs) {
    const attendees = faker.helpers.arrayElements(active, Math.min(program.enrolled, active.length))
    for (const emp of attendees) {
      const isDone = program.status === 'Selesai'
      participants.push({
        id: `TPT-${pad(counter++, 6)}`,
        programId: program.id,
        employeeId: emp.id,
        completionPct: isDone ? 100 : faker.number.int({ min: 0, max: 90 }),
        score: isDone ? faker.number.int({ min: 60, max: 100 }) : null,
        certificate: isDone && faker.number.int({ min: 1, max: 100 }) > 15,
      })
    }
  }
  return participants
}

const DOC_CATEGORIES: DocumentCategory[] = ['Kontrak', 'Identitas', 'Sertifikat', 'Slip Gaji', 'Surat Keputusan', 'Lainnya']
const DOC_NAME_BY_CATEGORY: Record<DocumentCategory, string[]> = {
  Kontrak: ['Kontrak Kerja PKWT', 'Kontrak Kerja PKWTT', 'Perjanjian Kerahasiaan'],
  Identitas: ['KTP', 'NPWP', 'Kartu Keluarga'],
  Sertifikat: ['Sertifikat Pelatihan', 'Sertifikat Kompetensi'],
  'Slip Gaji': ['Slip Gaji Bulanan'],
  'Surat Keputusan': ['SK Pengangkatan', 'SK Kenaikan Jabatan', 'SK Mutasi'],
  Lainnya: ['Surat Keterangan Kerja', 'Formulir BPJS'],
}

export function generateDocuments(employees: Employee[], perEmployee = 3): EmployeeDocument[] {
  const docs: EmployeeDocument[] = []
  let counter = 1
  const sample = employees.filter((e) => e.status !== 'Nonaktif').slice(0, 60)
  for (const emp of sample) {
    const n = faker.number.int({ min: 1, max: perEmployee })
    for (let i = 0; i < n; i++) {
      const category = faker.helpers.arrayElement(DOC_CATEGORIES)
      const uploadedAt = faker.date.between({ from: emp.joinDate, to: '2026-08-19' })
      const hasExpiry = category === 'Kontrak' || category === 'Identitas'
      const expiresAt = hasExpiry ? faker.date.between({ from: '2026-09-01', to: '2028-01-01' }).toISOString().slice(0, 10) : null
      docs.push({
        id: `DOC-${pad(counter++, 6)}`,
        employeeId: emp.id,
        name: faker.helpers.arrayElement(DOC_NAME_BY_CATEGORY[category]),
        category,
        uploadedAt: uploadedAt.toISOString().slice(0, 10),
        fileSize: `${faker.number.int({ min: 120, max: 3200 })} KB`,
        expiresAt,
      })
    }
  }
  return docs
}

export function generateAnnouncements(): Announcement[] {
  return [
    {
      id: 'ANN-0001',
      title: 'Libur Nasional & Cuti Bersama Agustus 2026',
      body: 'Perusahaan akan meliburkan seluruh karyawan pada tanggal 17 Agustus 2026 dalam rangka HUT Kemerdekaan RI. Aktivitas kerja kembali normal 18 Agustus 2026.',
      audience: 'Semua Karyawan',
      publishedAt: '2026-08-10T09:00:00',
      pinned: true,
      author: 'Tim HR',
    },
    {
      id: 'ANN-0002',
      title: 'Jadwal Pencairan Gaji Agustus',
      body: 'Gaji periode Agustus 2026 akan dicairkan pada tanggal 27 Agustus 2026. Slip gaji dapat diunduh melalui menu Payroll.',
      audience: 'Semua Karyawan',
      publishedAt: '2026-08-15T14:00:00',
      pinned: true,
      author: 'Tim Finance',
    },
    {
      id: 'ANN-0003',
      title: 'Pendaftaran Pelatihan Cloud & DevOps Dibuka',
      body: 'Tim Engineering dapat mendaftar program pelatihan "Cloud & DevOps Essentials" melalui menu Pelatihan. Kuota terbatas.',
      audience: 'Engineering',
      publishedAt: '2026-08-12T10:30:00',
      pinned: false,
      author: 'Tim L&D',
    },
    {
      id: 'ANN-0004',
      title: 'Reminder Update Data Kontrak Kerja',
      body: 'Mohon karyawan dengan kontrak PKWT yang akan berakhir bulan depan untuk menghubungi HR guna proses perpanjangan.',
      audience: 'Semua Karyawan',
      publishedAt: '2026-08-05T11:00:00',
      pinned: false,
      author: 'Tim HR',
    },
    {
      id: 'ANN-0005',
      title: 'Town Hall Kuartal 3 2026',
      body: 'Town hall akan diselenggarakan pada 28 Agustus 2026 pukul 15:00 WIB secara hybrid. Tautan akan dibagikan melalui email.',
      audience: 'Semua Karyawan',
      publishedAt: '2026-08-14T08:00:00',
      pinned: false,
      author: 'CEO Office',
    },
  ]
}

const GOAL_CATALOG: Record<Department, string[]> = {
  Engineering: ['Migrasi layanan ke arsitektur microservices', 'Menurunkan bug produksi 20%', 'Meningkatkan test coverage ke 80%'],
  Sales: ['Mencapai target penjualan Q3', 'Menambah 15 klien enterprise baru', 'Meningkatkan retensi klien 10%'],
  Marketing: ['Meningkatkan brand awareness 25%', 'Meluncurkan kampanye produk baru', 'Menaikkan lead generation 30%'],
  'Human Resources': ['Menurunkan time-to-hire 15%', 'Meningkatkan skor engagement karyawan', 'Menyelesaikan program onboarding baru'],
  Finance: ['Menutup buku bulanan H+3', 'Mengotomasi proses rekonsiliasi', 'Menurunkan biaya operasional 8%'],
  Operations: ['Meningkatkan efisiensi supply chain 12%', 'Menurunkan waktu proses pengadaan', 'Implementasi SOP baru gudang'],
  'Customer Support': ['Menurunkan average response time', 'Meningkatkan skor CSAT ke 90%', 'Menurunkan tiket eskalasi 20%'],
}

const GOAL_STATUS_WEIGHTS: [GoalStatus, number][] = [
  ['Berjalan', 45],
  ['Tercapai', 30],
  ['Berisiko', 15],
  ['Belum Dimulai', 10],
]

function rollGoalStatus(): GoalStatus {
  const total = GOAL_STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = faker.number.float({ min: 0, max: total })
  for (const [status, weight] of GOAL_STATUS_WEIGHTS) {
    if (r < weight) return status
    r -= weight
  }
  return 'Berjalan'
}

function progressForStatus(status: GoalStatus): number {
  if (status === 'Tercapai') return 100
  if (status === 'Belum Dimulai') return 0
  if (status === 'Berisiko') return faker.number.int({ min: 10, max: 45 })
  return faker.number.int({ min: 30, max: 90 })
}

export function generatePerformanceGoals(employees: Employee[], count = 160): PerformanceGoal[] {
  const active = employees.filter((e) => e.status === 'Aktif')
  const goals: PerformanceGoal[] = []
  for (let i = 1; i <= count; i++) {
    const emp = faker.helpers.arrayElement(active)
    const status = rollGoalStatus()
    const dueDate = faker.date.between({ from: '2026-07-01', to: '2026-09-30' })
    goals.push({
      id: `GOAL-${pad(i, 5)}`,
      employeeId: emp.id,
      period: '2026-Q3',
      title: faker.helpers.arrayElement(GOAL_CATALOG[emp.department]),
      category: faker.helpers.arrayElement(['Individu', 'Individu', 'Tim', 'Perusahaan']),
      progress: progressForStatus(status),
      status,
      dueDate: dueDate.toISOString().slice(0, 10),
    })
  }
  return goals
}

const REVIEW_STAGES: ReviewStage[] = ['Self Assessment', 'Manager Review', 'Kalibrasi', 'Selesai']
const REVIEWER_POOL = ['Budi Santoso', 'Siti Rahayu', 'Andi Wijaya', 'Dewi Lestari', 'Rudi Hartono']

export function generatePerformanceReviews(kpiRecords: KpiRecord[]): PerformanceReview[] {
  return kpiRecords.map((k, i) => {
    const stageRoll = faker.number.int({ min: 1, max: 100 })
    const stage: ReviewStage = stageRoll > 70 ? 'Selesai' : stageRoll > 45 ? 'Kalibrasi' : stageRoll > 20 ? 'Manager Review' : 'Self Assessment'
    const stageIndex = REVIEW_STAGES.indexOf(stage)
    const selfScore = stageIndex >= 0 ? clamp(k.overallScore + faker.number.int({ min: -6, max: 6 })) : null
    const managerScore = stageIndex >= 1 ? clamp(k.overallScore + faker.number.int({ min: -4, max: 4 })) : null
    const finalScore = stage === 'Selesai' ? k.overallScore : null
    return {
      id: `REV-${pad(i + 1, 6)}`,
      employeeId: k.employeeId,
      period: k.period,
      stage,
      selfScore,
      managerScore,
      finalScore,
      reviewer: faker.helpers.arrayElement(REVIEWER_POOL),
    }
  })
}

const SYSTEM_ROLE_BY_LEVEL: Record<Employee['level'], SystemRole> = {
  Staff: 'Karyawan',
  Supervisor: 'Karyawan',
  Manager: 'People Manager',
  Head: 'People Manager',
  Director: 'Super Admin',
}

export function generateSystemUsers(employees: Employee[]): SystemUser[] {
  const sample = employees.slice(0, 90)
  return sample.map((emp, i) => {
    const role: SystemRole =
      emp.department === 'Finance' && emp.level !== 'Staff'
        ? 'Finance Staff'
        : emp.department === 'Human Resources' && (emp.level === 'Manager' || emp.level === 'Head')
          ? 'HR Administrator'
          : SYSTEM_ROLE_BY_LEVEL[emp.level]
    const statusRoll = faker.number.int({ min: 1, max: 100 })
    const status: SystemUser['status'] = statusRoll > 97 ? 'Terkunci' : statusRoll > 94 ? 'Nonaktif' : 'Aktif'
    const lastLogin =
      status === 'Aktif' ? faker.date.between({ from: '2026-08-10', to: '2026-08-19T18:00:00' }).toISOString() : null
    return {
      id: `USR-${pad(i + 1, 5)}`,
      employeeId: emp.id,
      username: emp.email.split('@')[0],
      role,
      status,
      lastLogin,
      createdAt: emp.joinDate,
    }
  })
}

const AUDIT_ACTIONS: { action: string; module: string }[] = [
  { action: 'Menyetujui pengajuan cuti', module: 'Leave & Time Off' },
  { action: 'Menolak pengajuan lembur', module: 'Attendance' },
  { action: 'Mengubah data karyawan', module: 'People' },
  { action: 'Memproses payroll bulanan', module: 'Payroll' },
  { action: 'Mengunggah dokumen kontrak', module: 'People' },
  { action: 'Login ke sistem', module: 'Administration' },
  { action: 'Mengekspor data ke Excel', module: 'Import & Data Warehouse' },
  { action: 'Mengubah peran pengguna', module: 'Administration' },
  { action: 'Menyetujui klaim reimbursement', module: 'Payroll' },
  { action: 'Membuat lowongan pekerjaan baru', module: 'Rekrutmen' },
  { action: 'Memperbarui skor KPI', module: 'Performance' },
  { action: 'Mengubah pengaturan sistem', module: 'Administration' },
]

export function generateAuditLog(users: SystemUser[], employeeMap: Map<string, Employee>, count = 120): AuditLogEntry[] {
  const entries: AuditLogEntry[] = []
  for (let i = 1; i <= count; i++) {
    const user = faker.helpers.arrayElement(users)
    const actor = employeeMap.get(user.employeeId)?.name ?? user.username
    const { action, module } = faker.helpers.arrayElement(AUDIT_ACTIONS)
    const timestamp = faker.date.between({ from: '2026-07-01', to: '2026-08-19T18:00:00' })
    entries.push({
      id: `LOG-AUD-${pad(i, 6)}`,
      actor,
      action,
      module,
      target: employeeMap.get(faker.helpers.arrayElement(users).employeeId)?.name ?? 'Sistem',
      timestamp: timestamp.toISOString(),
      ipAddress: faker.internet.ipv4(),
      result: faker.number.int({ min: 1, max: 100 }) > 5 ? 'Berhasil' : 'Gagal',
    })
  }
  return entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

export function generateWorkflows(): WorkflowConfig[] {
  return [
    {
      id: 'WF-001',
      name: 'Persetujuan Cuti',
      module: 'Leave & Time Off',
      trigger: 'Karyawan mengajukan cuti',
      stages: [
        { name: 'Atasan Langsung', approver: 'Manager Departemen', slaHours: 24 },
        { name: 'HR Review', approver: 'HR Administrator', slaHours: 24 },
      ],
      active: true,
    },
    {
      id: 'WF-002',
      name: 'Persetujuan Lembur',
      module: 'Attendance',
      trigger: 'Karyawan mengajukan lembur',
      stages: [{ name: 'Atasan Langsung', approver: 'Manager Departemen', slaHours: 12 }],
      active: true,
    },
    {
      id: 'WF-003',
      name: 'Klaim Reimbursement',
      module: 'Payroll',
      trigger: 'Karyawan mengajukan klaim',
      stages: [
        { name: 'Atasan Langsung', approver: 'Manager Departemen', slaHours: 24 },
        { name: 'Finance Review', approver: 'Finance Staff', slaHours: 48 },
      ],
      active: true,
    },
    {
      id: 'WF-004',
      name: 'Proses Payroll Bulanan',
      module: 'Payroll',
      trigger: 'Tanggal 25 setiap bulan',
      stages: [
        { name: 'Kalkulasi Payroll', approver: 'Finance Staff', slaHours: 48 },
        { name: 'Persetujuan Finance', approver: 'Finance Manager', slaHours: 24 },
        { name: 'Pencairan', approver: 'Super Admin', slaHours: 24 },
      ],
      active: true,
    },
    {
      id: 'WF-005',
      name: 'Rekrutmen Kandidat',
      module: 'Rekrutmen',
      trigger: 'Kandidat mencapai tahap Penawaran',
      stages: [
        { name: 'Persetujuan Hiring Manager', approver: 'People Manager', slaHours: 48 },
        { name: 'Persetujuan HR', approver: 'HR Administrator', slaHours: 24 },
      ],
      active: false,
    },
  ]
}
