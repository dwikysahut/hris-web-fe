import { useMemo } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'
import { formatDate, formatDateTime, initials } from '../lib/utils'
import type { LeaveRequest } from '../lib/types'

export default function LeaveApproval() {
  const { leaveRequests, overtimeRequests, expenseClaims, employeeMap, setLeaveStatus } = useData()

  const pending = useMemo(
    () => leaveRequests.filter((r) => r.status === 'Menunggu').sort((a, b) => (a.requestedAt < b.requestedAt ? -1 : 1)),
    [leaveRequests]
  )
  const pendingOvertime = overtimeRequests.filter((r) => r.status === 'Menunggu').length
  const pendingClaims = expenseClaims.filter((r) => r.status === 'Menunggu').length

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (r) => {
        const emp = employeeMap.get(r.employeeId)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-5)' }}>
              {initials(emp?.name ?? '-')}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{emp?.name ?? r.employeeId}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{emp?.department}</div>
            </div>
          </div>
        )
      },
      sortValue: (r) => employeeMap.get(r.employeeId)?.name ?? '',
    },
    { key: 'type', header: 'Jenis', render: (r) => r.type },
    { key: 'period', header: 'Periode', render: (r) => `${formatDate(r.startDate)} — ${formatDate(r.endDate)}`, sortValue: (r) => r.startDate },
    { key: 'days', header: 'Hari', align: 'right', render: (r) => r.days, sortValue: (r) => r.days },
    { key: 'requestedAt', header: 'Diajukan', render: (r) => formatDateTime(r.requestedAt), sortValue: (r) => r.requestedAt },
    {
      key: 'action',
      header: 'Aksi',
      align: 'center',
      render: (r) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setLeaveStatus(r.id, 'Disetujui')}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
            style={{ background: 'var(--status-good)' }}
          >
            Setujui
          </button>
          <button
            onClick={() => setLeaveStatus(r.id, 'Ditolak')}
            className="rounded-md border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--status-critical)' }}
          >
            Tolak
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Approval" subtitle="Inbox persetujuan pengajuan cuti yang menunggu tindakan Anda">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cuti Menunggu" value={pending.length.toLocaleString('id-ID')} positive={pending.length === 0} />
        <StatCard label="Lembur Menunggu" value={pendingOvertime.toLocaleString('id-ID')} />
        <StatCard label="Klaim Menunggu" value={pendingClaims.toLocaleString('id-ID')} />
      </div>
      <Card className="mt-4" title="Menunggu Persetujuan" subtitle="Diurutkan berdasarkan yang paling lama menunggu">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Badge tone="good">Semua pengajuan cuti sudah diproses</Badge>
          </div>
        ) : (
          <DataTable columns={columns} rows={pending} pageSize={10} />
        )}
      </Card>
    </AppShell>
  )
}
