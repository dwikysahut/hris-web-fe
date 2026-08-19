import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useData } from '../lib/dataStore'
import { formatDateTime } from '../lib/utils'
import type { AuditLogEntry } from '../lib/types'

export default function AuditLog() {
  const { auditLog } = useData()
  const [moduleFilter, setModuleFilter] = useState('Semua')
  const [query, setQuery] = useState('')

  const modules = useMemo(() => Array.from(new Set(auditLog.map((l) => l.module))).sort(), [auditLog])
  const failedCount = auditLog.filter((l) => l.result === 'Gagal').length

  const filtered = useMemo(
    () =>
      auditLog.filter(
        (l) =>
          (moduleFilter === 'Semua' || l.module === moduleFilter) &&
          (!query || l.actor.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase()))
      ),
    [auditLog, moduleFilter, query]
  )

  const columns: Column<AuditLogEntry>[] = [
    { key: 'actor', header: 'Pengguna', render: (l) => <span className="font-medium">{l.actor}</span>, sortValue: (l) => l.actor },
    { key: 'action', header: 'Aktivitas', render: (l) => l.action },
    { key: 'module', header: 'Modul', render: (l) => <Badge tone="neutral">{l.module}</Badge>, sortValue: (l) => l.module },
    { key: 'timestamp', header: 'Waktu', render: (l) => formatDateTime(l.timestamp), sortValue: (l) => l.timestamp },
    { key: 'ipAddress', header: 'IP Address', render: (l) => <span className="tabular-nums text-xs">{l.ipAddress}</span> },
    {
      key: 'result',
      header: 'Hasil',
      align: 'center',
      render: (l) => <Badge tone={l.result === 'Berhasil' ? 'good' : 'critical'}>{l.result}</Badge>,
      sortValue: (l) => l.result,
    },
  ]

  return (
    <AppShell title="Audit Log" subtitle="Riwayat aktivitas pengguna di seluruh sistem HRIS">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Aktivitas" value={auditLog.length.toLocaleString('id-ID')} />
        <StatCard label="Gagal" value={failedCount.toLocaleString('id-ID')} positive={failedCount === 0} />
        <StatCard label="Modul Terpantau" value={modules.length.toString()} />
      </div>
      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pengguna atau aktivitas..."
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <option>Semua</option>
            {modules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} rows={filtered} pageSize={12} />
      </Card>
    </AppShell>
  )
}
