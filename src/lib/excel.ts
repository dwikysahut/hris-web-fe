import * as XLSX from 'xlsx'
import type { AttendanceRecord, Employee, ExpenseClaim, KpiRecord, LeaveRequest, PayrollRecord } from './types'

function download(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName)
}

export function exportEmployees(employees: Employee[]) {
  const rows = employees.map((e) => ({
    'Kode Karyawan': e.employeeCode,
    Nama: e.name,
    Email: e.email,
    Telepon: e.phone,
    Departemen: e.department,
    Posisi: e.position,
    Level: e.level,
    'Tanggal Bergabung': e.joinDate,
    Status: e.status,
    'Jenis Kelamin': e.gender,
    Lokasi: e.location,
    Atasan: e.manager,
    'Rentang Gaji': e.salaryRange,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')
  download(wb, `data_karyawan_${Date.now()}.xlsx`)
}

export function exportAttendance(records: AttendanceRecord[], employeeMap: Map<string, Employee>) {
  const rows = records.map((r) => ({
    'Kode Karyawan': employeeMap.get(r.employeeId)?.employeeCode ?? r.employeeId,
    Nama: employeeMap.get(r.employeeId)?.name ?? '-',
    Tanggal: r.date,
    Status: r.status,
    'Jam Masuk': r.checkIn ?? '-',
    'Jam Keluar': r.checkOut ?? '-',
    'Jam Kerja': r.workHours,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Absensi')
  download(wb, `data_absensi_${Date.now()}.xlsx`)
}

export function exportKpi(records: KpiRecord[], employeeMap: Map<string, Employee>) {
  const rows = records.map((r) => ({
    'Kode Karyawan': employeeMap.get(r.employeeId)?.employeeCode ?? r.employeeId,
    Nama: employeeMap.get(r.employeeId)?.name ?? '-',
    Periode: r.period,
    Produktivitas: r.productivity,
    Kualitas: r.quality,
    Kedisiplinan: r.discipline,
    Kerjasama: r.teamwork,
    Inisiatif: r.initiative,
    Target: r.target,
    Pencapaian: r.achievement,
    'Skor Akhir': r.overallScore,
    Rating: r.rating,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'KPI')
  download(wb, `data_kpi_${Date.now()}.xlsx`)
}

export function exportPayroll(records: PayrollRecord[], employeeMap: Map<string, Employee>) {
  const rows = records.map((r) => ({
    'Kode Karyawan': employeeMap.get(r.employeeId)?.employeeCode ?? r.employeeId,
    Nama: employeeMap.get(r.employeeId)?.name ?? '-',
    Periode: r.period,
    'Gaji Pokok': r.basicSalary,
    Tunjangan: r.allowance,
    Lembur: r.overtimePay,
    Bonus: r.bonus,
    'BPJS Kesehatan': r.bpjsKesehatan,
    'BPJS Ketenagakerjaan': r.bpjsKetenagakerjaan,
    'PPh 21': r.pph21,
    'Potongan Lain': r.otherDeduction,
    'Gaji Kotor': r.grossPay,
    'Gaji Bersih': r.netPay,
    Status: r.status,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll')
  download(wb, `data_penggajian_${Date.now()}.xlsx`)
}

export function exportLeaveRequests(records: LeaveRequest[], employeeMap: Map<string, Employee>) {
  const rows = records.map((r) => ({
    'Kode Karyawan': employeeMap.get(r.employeeId)?.employeeCode ?? r.employeeId,
    Nama: employeeMap.get(r.employeeId)?.name ?? '-',
    Jenis: r.type,
    'Tanggal Mulai': r.startDate,
    'Tanggal Selesai': r.endDate,
    Hari: r.days,
    Alasan: r.reason,
    Status: r.status,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cuti')
  download(wb, `data_cuti_${Date.now()}.xlsx`)
}

export function exportClaims(records: ExpenseClaim[], employeeMap: Map<string, Employee>) {
  const rows = records.map((r) => ({
    'Kode Karyawan': employeeMap.get(r.employeeId)?.employeeCode ?? r.employeeId,
    Nama: employeeMap.get(r.employeeId)?.name ?? '-',
    Kategori: r.category,
    Deskripsi: r.description,
    Nominal: r.amount,
    Diajukan: r.submittedAt,
    Status: r.status,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reimbursement')
  download(wb, `data_reimbursement_${Date.now()}.xlsx`)
}

export function downloadEmployeeTemplate() {
  const rows = [
    {
      'Kode Karyawan': 'ADW-0141',
      Nama: 'Contoh Nama',
      Email: 'contoh.nama@kantor.co.id',
      Telepon: '+62 812-0000-0000',
      Departemen: 'Engineering',
      Posisi: 'Software Engineer',
      Level: 'Staff',
      'Tanggal Bergabung': '2026-01-01',
      Status: 'Aktif',
      'Jenis Kelamin': 'L',
      Lokasi: 'Jakarta HQ',
      Atasan: 'Budi Santoso',
      'Rentang Gaji': 'Rp 6.500.000 – Rp 8.500.000',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template Karyawan')
  download(wb, 'template_import_karyawan.xlsx')
}

export function downloadAttendanceTemplate() {
  const rows = [
    {
      'Kode Karyawan': 'ADW-0001',
      Tanggal: '2026-08-19',
      Status: 'Hadir',
      'Jam Masuk': '08:05',
      'Jam Keluar': '17:10',
      'Jam Kerja': 8.1,
    },
  ]
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template Absensi')
  download(wb, 'template_import_absensi.xlsx')
}

export interface ParsedImportResult {
  rows: Record<string, unknown>[]
  sheetName: string
}

export function parseWorkbookFile(file: File): Promise<ParsedImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'binary' })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        resolve({ rows, sheetName })
      } catch (err) {
        reject(err as Error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsBinaryString(file)
  })
}
