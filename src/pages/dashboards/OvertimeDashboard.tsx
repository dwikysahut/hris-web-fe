import { useMemo } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart'
import { useData } from '../../lib/dataStore'
import { formatCurrency } from '../../lib/utils'

const OVERTIME_RATE_PER_HOUR = 75000

export default function OvertimeDashboard() {
  const { overtimeRequests, employeeMap } = useData()

  const approved = overtimeRequests.filter((r) => r.status === 'Disetujui')
  const pending = overtimeRequests.filter((r) => r.status === 'Menunggu').length
  const totalHours = approved.reduce((s, r) => s + r.hours, 0)
  const estimatedCost = approved.filter((r) => r.compensation === 'Uang Lembur').reduce((s, r) => s + r.hours * OVERTIME_RATE_PER_HOUR, 0)

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) {
      const dept = employeeMap.get(r.employeeId)?.department
      if (!dept) continue
      counts.set(dept, (counts.get(dept) ?? 0) + r.hours)
    }
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved, employeeMap])

  const byCompensation = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of approved) counts.set(r.compensation, (counts.get(r.compensation) ?? 0) + r.hours)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [approved])

  return (
    <AppShell title="Overtime" subtitle="Executive Dashboard — ringkasan jam lembur perusahaan">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menunggu Persetujuan" value={pending.toLocaleString('id-ID')} positive={pending === 0} />
        <StatCard label="Total Jam Disetujui" value={`${totalHours.toLocaleString('id-ID')} jam`} />
        <StatCard label="Estimasi Biaya Lembur" value={formatCurrency(estimatedCost)} deltaLabel="uang lembur" />
        <StatCard label="Total Pengajuan" value={overtimeRequests.length.toLocaleString('id-ID')} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Jam Lembur per Departemen">
          <DepartmentBarChart data={byDepartment} valueLabel="Jam" />
        </Card>
        <Card title="Jam Lembur per Jenis Kompensasi">
          <DepartmentBarChart data={byCompensation} valueLabel="Jam" />
        </Card>
      </div>
    </AppShell>
  )
}
