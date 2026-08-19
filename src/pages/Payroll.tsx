import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { makeId, useData } from '../lib/dataStore'
import { exportPayroll } from '../lib/excel'
import { formatCurrency, initials } from '../lib/utils'
import type { PayrollRecord } from '../lib/types'

const STATUSES: PayrollRecord['status'][] = ['Draft', 'Diproses', 'Dibayar']

const BLANK_FORM = {
  employeeId: '',
  period: new Date().toISOString().slice(0, 7),
  basicSalary: 0,
  allowance: 0,
  overtimePay: 0,
  bonus: 0,
  bpjsKesehatan: 0,
  bpjsKetenagakerjaan: 0,
  pph21: 0,
  otherDeduction: 0,
  status: 'Draft' as PayrollRecord['status'],
}

export default function Payroll() {
  const { payroll, employees, employeeMap, addPayrollRecord, updatePayrollRecord, deletePayrollRecord } = useData()
  const periods = useMemo(() => Array.from(new Set(payroll.map((p) => p.period))).sort(), [payroll])
  const [period, setPeriod] = useState(periods[periods.length - 1])

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPaidAt, setEditingPaidAt] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null)

  const grossPay = form.basicSalary + form.allowance + form.overtimePay + form.bonus
  const netPay = grossPay - form.bpjsKesehatan - form.bpjsKetenagakerjaan - form.pph21 - form.otherDeduction

  const openCreate = () => {
    setEditingId(null)
    setEditingPaidAt(null)
    setForm({ ...BLANK_FORM, employeeId: employees[0]?.id ?? '' })
    setFormOpen(true)
  }

  const openEdit = (r: PayrollRecord) => {
    setEditingId(r.id)
    setEditingPaidAt(r.paidAt)
    setForm({
      employeeId: r.employeeId,
      period: r.period,
      basicSalary: r.basicSalary,
      allowance: r.allowance,
      overtimePay: r.overtimePay,
      bonus: r.bonus,
      bpjsKesehatan: r.bpjsKesehatan,
      bpjsKetenagakerjaan: r.bpjsKetenagakerjaan,
      pph21: r.pph21,
      otherDeduction: r.otherDeduction,
      status: r.status,
    })
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const paidAt = form.status === 'Dibayar' ? (editingPaidAt ?? new Date().toISOString()) : null
    if (editingId) {
      updatePayrollRecord(editingId, { ...form, grossPay, netPay, paidAt })
    } else {
      addPayrollRecord({
        id: makeId('PAY'),
        ...form,
        grossPay,
        netPay,
        paidAt,
      })
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) deletePayrollRecord(deleteTarget.id)
    setDeleteTarget(null)
  }

  const periodRecords = useMemo(() => payroll.filter((p) => p.period === period), [payroll, period])

  const totalNet = periodRecords.reduce((s, p) => s + p.netPay, 0)
  const totalGross = periodRecords.reduce((s, p) => s + p.grossPay, 0)
  const totalDeduction = totalGross - totalNet
  const avgNet = periodRecords.length ? totalNet / periodRecords.length : 0

  const costByDepartment = useMemo(() => {
    const sums = new Map<string, number>()
    for (const p of periodRecords) {
      const dept = employeeMap.get(p.employeeId)?.department
      if (!dept) continue
      sums.set(dept, (sums.get(dept) ?? 0) + p.netPay)
    }
    return Array.from(sums.entries()).map(([department, value]) => ({ department, value: Math.round(value / 1_000_000) }))
  }, [periodRecords, employeeMap])

  const columns: Column<PayrollRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-6)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? r.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.position}</div>
            </div>
          </div>
        )
      },
      sortValue: (r) => employeeMap.get(r.employeeId)?.name ?? '',
    },
    {
      key: 'basicSalary',
      header: 'Gaji Pokok',
      align: 'right',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.basicSalary)}</span>,
      sortValue: (r) => r.basicSalary,
    },
    {
      key: 'allowance',
      header: 'Tunjangan',
      align: 'right',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.allowance)}</span>,
      sortValue: (r) => r.allowance,
    },
    {
      key: 'deduction',
      header: 'Potongan',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums" style={{ color: 'var(--status-critical)' }}>
          -{formatCurrency(r.bpjsKesehatan + r.bpjsKetenagakerjaan + r.pph21 + r.otherDeduction)}
        </span>
      ),
      sortValue: (r) => r.bpjsKesehatan + r.bpjsKetenagakerjaan + r.pph21 + r.otherDeduction,
    },
    {
      key: 'netPay',
      header: 'Gaji Bersih',
      align: 'right',
      render: (r) => <span className="tabular-nums font-semibold">{formatCurrency(r.netPay)}</span>,
      sortValue: (r) => r.netPay,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => <Badge tone={approvalTone(r.status)}>{r.status}</Badge>,
      sortValue: (r) => r.status,
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
    <AppShell title="Penggajian" subtitle="Rekap payroll bulanan, komponen gaji, dan status pembayaran">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Gaji Kotor" value={formatCurrency(totalGross)} />
        <StatCard label="Total Potongan" value={formatCurrency(totalDeduction)} positive={false} />
        <StatCard label="Total Gaji Bersih" value={formatCurrency(totalNet)} />
        <StatCard label="Rata-rata Gaji Bersih" value={formatCurrency(avgNet)} deltaLabel={`${periodRecords.length} karyawan`} />
      </div>

      <Card className="mt-4" title="Biaya Gaji per Departemen" subtitle="Dalam juta Rupiah — gaji bersih">
        <DepartmentBarChart data={costByDepartment} valueLabel="Juta Rupiah" />
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              + Tambah Payroll
            </button>
            <button
              onClick={() => exportPayroll(periodRecords, employeeMap)}
              className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Export Slip Gaji (Excel)
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={periodRecords} pageSize={10} emptyLabel="Tidak ada data payroll" />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Ubah Payroll' : 'Tambah Payroll'}
        subtitle={editingId ? 'Perbarui data payroll karyawan' : 'Data akan disimpan sebagai data simulasi'}
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
              <option value="" disabled>
                Pilih karyawan
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Periode">
            <input
              required
              type="month"
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Gaji Pokok">
            <input
              required
              type="number"
              min={0}
              value={form.basicSalary}
              onChange={(e) => setForm((f) => ({ ...f, basicSalary: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tunjangan">
            <input
              required
              type="number"
              min={0}
              value={form.allowance}
              onChange={(e) => setForm((f) => ({ ...f, allowance: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Uang Lembur">
            <input
              required
              type="number"
              min={0}
              value={form.overtimePay}
              onChange={(e) => setForm((f) => ({ ...f, overtimePay: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Bonus">
            <input
              required
              type="number"
              min={0}
              value={form.bonus}
              onChange={(e) => setForm((f) => ({ ...f, bonus: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="BPJS Kesehatan">
            <input
              required
              type="number"
              min={0}
              value={form.bpjsKesehatan}
              onChange={(e) => setForm((f) => ({ ...f, bpjsKesehatan: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="BPJS Ketenagakerjaan">
            <input
              required
              type="number"
              min={0}
              value={form.bpjsKetenagakerjaan}
              onChange={(e) => setForm((f) => ({ ...f, bpjsKetenagakerjaan: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="PPh 21">
            <input
              required
              type="number"
              min={0}
              value={form.pph21}
              onChange={(e) => setForm((f) => ({ ...f, pph21: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Potongan Lainnya">
            <input
              required
              type="number"
              min={0}
              value={form.otherDeduction}
              onChange={(e) => setForm((f) => ({ ...f, otherDeduction: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PayrollRecord['status'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Gaji Kotor (otomatis)">
            <div
              className="w-full rounded-lg border px-3 py-2 text-sm tabular-nums text-[var(--text-primary)]"
              style={{ borderColor: 'var(--border)', background: 'var(--page-plane)' }}
            >
              {formatCurrency(grossPay)}
            </div>
          </FormField>
          <FormField label="Gaji Bersih (otomatis)">
            <div
              className="w-full rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums text-[var(--text-primary)]"
              style={{ borderColor: 'var(--border)', background: 'var(--page-plane)' }}
            >
              {formatCurrency(netPay)}
            </div>
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Payroll'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Payroll"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus data payroll{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {deleteTarget ? employeeMap.get(deleteTarget.employeeId)?.name ?? deleteTarget.employeeId : ''}
          </span>{' '}
          periode <span className="font-medium text-[var(--text-primary)]">{deleteTarget?.period}</span> ini?
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
