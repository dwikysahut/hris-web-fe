import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { useData } from '../../lib/dataStore'

export default function LeaveDashboard() {
  const { leaveRequests, employeeMap } = useData()

  const pending = leaveRequests.filter((r) => r.status === 'Menunggu').length
  const approved = leaveRequests.filter((r) => r.status === 'Disetujui')
  const totalDays = approved.reduce((s, r) => s + r.days, 0)
  const onLeaveToday = leaveRequests.filter(
    (r) => r.status === 'Disetujui' && r.startDate <= '2026-08-19' && r.endDate >= '2026-08-19'
  ).length

  const byType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) counts.set(r.type, (counts.get(r.type) ?? 0) + r.days)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved])

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) {
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      counts.set(dept, (counts.get(dept) ?? 0) + r.days)
    }
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved, employeeMap])

  return (
    <AppShell title="Leave" subtitle="Executive Dashboard — ringkasan cuti dan izin perusahaan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menunggu Persetujuan" value={pending.toLocaleString('id-ID')} positive={pending === 0} />
        <StatCard label="Total Hari Cuti Disetujui" value={totalDays.toLocaleString('id-ID')} deltaLabel="periode berjalan" />
        <StatCard label="Sedang Cuti Hari Ini" value={onLeaveToday.toLocaleString('id-ID')} />
        <StatCard label="Total Pengajuan" value={leaveRequests.length.toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Hari Cuti per Jenis">
          <DepartmentBarChart data={byType} valueLabel="Hari" />
        </Card>
        <Card title="Hari Cuti per Departemen">
          <DepartmentBarChart data={byDepartment} valueLabel="Hari" />
        </Card>
      </div>
    </AppShell>
  )
}
