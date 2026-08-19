import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useData } from '../lib/dataStore'
import { formatCurrency, formatDate, initials } from '../lib/utils'

export default function Payslip() {
  const { employees, payroll } = useData()
  const active = useMemo(() => employees.filter((e) => e.status !== 'Nonaktif'), [employees])
  const [employeeId, setEmployeeId] = useState(active[0]?.id ?? '')

  const employeeRecords = useMemo(() => payroll.filter((p) => p.employeeId === employeeId).sort((a, b) => (a.period < b.period ? 1 : -1)), [payroll, employeeId])
  const [period, setPeriod] = useState(employeeRecords[0]?.period ?? '')

  const record = employeeRecords.find((p) => p.period === period) ?? employeeRecords[0]
  const employee = employees.find((e) => e.id === employeeId)

  function handleEmployeeChange(id: string) {
    setEmployeeId(id)
    const recs = payroll.filter((p) => p.employeeId === id).sort((a, b) => (a.period < b.period ? 1 : -1))
    setPeriod(recs[0]?.period ?? '')
  }

  return (
    <AppShell title="Payslip" subtitle="Cetak dan lihat slip gaji per karyawan">
      <Card>
        <div className="flex flex-wrap gap-3">
          <select
            value={employeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {active.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.employeeCode}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {employeeRecords.map((r) => (
              <option key={r.period} value={r.period}>
                {r.period}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            Cetak / Simpan PDF
          </button>
        </div>
      </Card>

      {employee && record ? (
        <Card className="mt-4">
          <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">PT Office Teknologi Indonesia</h2>
                <p className="text-xs text-[var(--text-muted)]">Slip Gaji Karyawan — Periode {record.period}</p>
              </div>
              <Badge tone={record.status === 'Dibayar' ? 'good' : 'warning'}>{record.status}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b py-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white" style={{ background: 'var(--series-1)' }}>
              {initials(employee.name)}
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Nama</div>
                <div className="font-medium">{employee.name}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Kode</div>
                <div className="font-medium">{employee.employeeCode}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Posisi</div>
                <div className="font-medium">{employee.position}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Departemen</div>
                <div className="font-medium">{employee.department}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Pendapatan</h3>
              <PayRow label="Gaji Pokok" value={record.basicSalary} />
              <PayRow label="Tunjangan Tetap" value={record.allowance} />
              <PayRow label="Uang Lembur" value={record.overtimePay} />
              <PayRow label="Bonus" value={record.bonus} />
              <PayRow label="Total Pendapatan" value={record.grossPay} bold />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Potongan</h3>
              <PayRow label="BPJS Kesehatan" value={record.bpjsKesehatan} negative />
              <PayRow label="BPJS Ketenagakerjaan" value={record.bpjsKetenagakerjaan} negative />
              <PayRow label="PPh 21" value={record.pph21} negative />
              <PayRow label="Potongan Lainnya" value={record.otherDeduction} negative />
              <PayRow label="Total Potongan" value={record.bpjsKesehatan + record.bpjsKetenagakerjaan + record.pph21 + record.otherDeduction} bold negative />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Gaji Bersih Diterima</span>
            <span className="tabular-nums text-xl font-bold" style={{ color: 'var(--status-good)' }}>
              {formatCurrency(record.netPay)}
            </span>
          </div>
          {record.paidAt && <p className="mt-2 text-xs text-[var(--text-muted)]">Dibayarkan pada {formatDate(record.paidAt)}</p>}
        </Card>
      ) : (
        <Card className="mt-4">
          <p className="text-sm text-[var(--text-muted)]">Tidak ada data payroll untuk karyawan ini.</p>
        </Card>
      )}
    </AppShell>
  )
}

function PayRow({ label, value, bold = false, negative = false }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={bold ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''}`} style={{ color: negative ? 'var(--status-critical)' : 'var(--text-primary)' }}>
        {negative ? '-' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  )
}
