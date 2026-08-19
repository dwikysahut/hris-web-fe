import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, ratingTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { AttendanceTrendChart, type TrendPoint } from '../components/charts/AttendanceTrendChart'
import { DepartmentBarChart } from '../components/charts/DepartmentBarChart'
import { KpiScoreChart } from '../components/charts/KpiScoreChart'
import { useData } from '../lib/dataStore'
import { formatCurrency, formatCurrencyCompact } from '../lib/utils'
import type { Department, KpiRecord } from '../lib/types'

const TODAY = '2026-08-19'
const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]
const LOCATIONS = ['Jakarta HQ', 'Bandung Hub', 'Surabaya Hub', 'Remote']

export default function Dashboard() {
  const { employees, attendance, kpi, employeeMap, leaveRequests, overtimeRequests, expenseClaims, payroll } =
    useData()

  const [deptFilter, setDeptFilter] = useState<'Semua' | Department>('Semua')
  const [locationFilter, setLocationFilter] = useState('Semua')

  const scopedEmployees = useMemo(
    () =>
      employees.filter(
        (e) => (deptFilter === 'Semua' || e.department === deptFilter) && (locationFilter === 'Semua' || e.location === locationFilter)
      ),
    [employees, deptFilter, locationFilter]
  )
  const scopedIds = useMemo(() => new Set(scopedEmployees.map((e) => e.id)), [scopedEmployees])
  const activeEmployees = useMemo(() => scopedEmployees.filter((e) => e.status !== 'Nonaktif'), [scopedEmployees])

  const todayRecords = useMemo(
    () => attendance.filter((a) => a.date === TODAY && scopedIds.has(a.employeeId)),
    [attendance, scopedIds]
  )
  const hadirToday = todayRecords.filter((a) => a.status === 'Hadir' || a.status === 'WFH').length
  const attendanceRatePct = todayRecords.length ? (hadirToday / todayRecords.length) * 100 : 0
  const onLeaveToday = todayRecords.filter((a) => a.status === 'Cuti' || a.status === 'Izin').length

  const latestPeriod = useMemo(() => {
    const periods = Array.from(new Set(kpi.map((k) => k.period))).sort()
    return periods[periods.length - 1]
  }, [kpi])

  const latestKpiByEmployee = useMemo(() => {
    const map = new Map<string, KpiRecord>()
    for (const k of kpi) {
      if (k.period === latestPeriod && scopedIds.has(k.employeeId)) map.set(k.employeeId, k)
    }
    return map
  }, [kpi, latestPeriod, scopedIds])

  const avgKpiScore = useMemo(() => {
    const values = Array.from(latestKpiByEmployee.values()).map((k) => k.overallScore)
    return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
  }, [latestKpiByEmployee])

  const newHiresThisYear = useMemo(
    () => scopedEmployees.filter((e) => e.joinDate.startsWith('2026')).length,
    [scopedEmployees]
  )

  const currentPayrollPeriod = useMemo(() => {
    const periods = Array.from(new Set(payroll.map((p) => p.period))).sort()
    return periods[periods.length - 1]
  }, [payroll])
  const currentPayrollTotal = useMemo(
    () =>
      payroll
        .filter((p) => p.period === currentPayrollPeriod && scopedIds.has(p.employeeId))
        .reduce((s, p) => s + p.netPay, 0),
    [payroll, currentPayrollPeriod, scopedIds]
  )

  const trendData: TrendPoint[] = useMemo(() => {
    const byDate = new Map<string, { hadir: number; terlambat: number; total: number }>()
    for (const r of attendance) {
      if (!scopedIds.has(r.employeeId)) continue
      const bucket = byDate.get(r.date) ?? { hadir: 0, terlambat: 0, total: 0 }
      bucket.total += 1
      if (r.status === 'Hadir' || r.status === 'WFH') bucket.hadir += 1
      if (r.status === 'Terlambat') bucket.terlambat += 1
      byDate.set(r.date, bucket)
    }
    const dates = Array.from(byDate.keys()).sort().slice(-30)
    return dates.map((date) => {
      const b = byDate.get(date)!
      return {
        date,
        label: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        hadirPct: b.total ? (b.hadir / b.total) * 100 : 0,
        terlambatPct: b.total ? (b.terlambat / b.total) * 100 : 0,
      }
    })
  }, [attendance, scopedIds])

  const departmentHeadcount = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of activeEmployees) counts.set(e.department, (counts.get(e.department) ?? 0) + 1)
    return Array.from(counts.entries()).map(([department, value]) => ({ department, value }))
  }, [activeEmployees])

  const levelDistribution = useMemo(() => {
    const order = ['Staff', 'Supervisor', 'Manager', 'Head', 'Director']
    const counts = new Map<string, number>()
    for (const e of activeEmployees) counts.set(e.level, (counts.get(e.level) ?? 0) + 1)
    return order.filter((l) => counts.has(l)).map((department) => ({ department, value: counts.get(department) ?? 0 }))
  }, [activeEmployees])

  const genderDistribution = useMemo(() => {
    const male = activeEmployees.filter((e) => e.gender === 'L').length
    const female = activeEmployees.filter((e) => e.gender === 'P').length
    return [
      { department: 'Laki-laki', value: male },
      { department: 'Perempuan', value: female },
    ]
  }, [activeEmployees])

  const ratingDistribution = useMemo(() => {
    const order: KpiRecord['rating'][] = ['A', 'B', 'C', 'D']
    const counts = new Map<string, number>()
    for (const k of latestKpiByEmployee.values()) counts.set(k.rating, (counts.get(k.rating) ?? 0) + 1)
    return order.map((r) => ({ department: `Rating ${r}`, value: counts.get(r) ?? 0 }))
  }, [latestKpiByEmployee])

  const kpiByDepartment = useMemo(() => {
    const sums = new Map<string, { total: number; count: number }>()
    for (const k of latestKpiByEmployee.values()) {
      const emp = employeeMap.get(k.employeeId)
      if (!emp) continue
      const bucket = sums.get(emp.department) ?? { total: 0, count: 0 }
      bucket.total += k.overallScore
      bucket.count += 1
      sums.set(emp.department, bucket)
    }
    return Array.from(sums.entries())
      .map(([label, { total, count }]) => ({ label, score: Math.round(total / count) }))
      .sort((a, b) => b.score - a.score)
  }, [latestKpiByEmployee, employeeMap])

  const topPerformers = useMemo(() => {
    return Array.from(latestKpiByEmployee.values())
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 6)
  }, [latestKpiByEmployee])

  const pendingLeave = leaveRequests.filter((r) => r.status === 'Menunggu').length
  const pendingOvertime = overtimeRequests.filter((r) => r.status === 'Menunggu').length
  const pendingClaims = expenseClaims.filter((r) => r.status === 'Menunggu')

  const columns: Column<KpiRecord>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      render: (row) => {
        const emp = employeeMap.get(row.employeeId)
        return (
          <div>
            <div className="font-medium">{emp?.name ?? row.employeeId}</div>
            <div className="text-xs text-[var(--text-muted)]">{emp?.position}</div>
          </div>
        )
      },
      sortValue: (row) => employeeMap.get(row.employeeId)?.name ?? '',
    },
    {
      key: 'department',
      header: 'Departemen',
      render: (row) => employeeMap.get(row.employeeId)?.department ?? '-',
    },
    {
      key: 'score',
      header: 'Skor KPI',
      align: 'right',
      render: (row) => <span className="tabular-nums font-semibold">{row.overallScore}</span>,
      sortValue: (row) => row.overallScore,
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'center',
      render: (row) => <Badge tone={ratingTone(row.rating)}>{row.rating}</Badge>,
    },
  ]

  const activeFilterCount = (deptFilter !== 'Semua' ? 1 : 0) + (locationFilter !== 'Semua' ? 1 : 0)

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan performa dan kehadiran karyawan — 19 Agustus 2026">
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filter
        </span>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as typeof deptFilter)}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          <option value="Semua">Semua Departemen</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          <option value="Semua">Semua Lokasi</option>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setDeptFilter('Semua')
              setLocationFilter('Semua')
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{ color: 'var(--series-1)' }}
          >
            Reset filter ({activeFilterCount})
          </button>
        )}
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          Menampilkan {activeEmployees.length} dari {employees.filter((e) => e.status !== 'Nonaktif').length} karyawan aktif
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Karyawan Aktif" value={activeEmployees.length.toLocaleString('id-ID')} delta={`${newHiresThisYear} baru`} deltaLabel="2026" positive />
        <StatCard
          label="Kehadiran Hari Ini"
          value={`${attendanceRatePct.toFixed(1)}%`}
          delta={`${hadirToday}/${todayRecords.length}`}
          deltaLabel="hadir"
          positive={attendanceRatePct >= 85}
        />
        <StatCard
          label="Rata-rata KPI"
          value={avgKpiScore.toFixed(1)}
          delta={avgKpiScore >= 75 ? 'Di atas target' : 'Perlu perhatian'}
          deltaLabel={latestPeriod}
          positive={avgKpiScore >= 75}
        />
        <StatCard
          label="Cuti / Izin Hari Ini"
          value={onLeaveToday.toLocaleString('id-ID')}
          delta={`${((onLeaveToday / Math.max(1, todayRecords.length)) * 100).toFixed(1)}%`}
          deltaLabel="dari total"
          positive={onLeaveToday < todayRecords.length * 0.05}
        />
        <StatCard label={`Biaya Payroll ${currentPayrollPeriod ?? ''}`} value={formatCurrencyCompact(currentPayrollTotal)} deltaLabel="gaji bersih" />
      </div>

      <Card className="mt-3" title="Perlu Tindakan" subtitle="Ringkasan proses yang menunggu persetujuan Anda">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionTile to="/cuti" label="Pengajuan Cuti" value={pendingLeave} />
          <ActionTile to="/lembur" label="Pengajuan Lembur" value={pendingOvertime} />
          <ActionTile
            to="/reimbursement"
            label="Klaim Reimbursement"
            value={pendingClaims.length}
            hint={pendingClaims.length ? formatCurrency(pendingClaims.reduce((s, c) => s + c.amount, 0)) : undefined}
          />
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card title="Tren Kehadiran" subtitle="Persentase hadir & terlambat, 30 hari kerja terakhir" className="xl:col-span-2">
          <AttendanceTrendChart data={trendData} />
        </Card>
        <Card title="Karyawan per Departemen" subtitle="Headcount aktif">
          <DepartmentBarChart data={departmentHeadcount} />
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Jenjang Jabatan" subtitle="Distribusi level">
          <DepartmentBarChart data={levelDistribution} sortDescending={false} />
        </Card>
        <Card title="Jenis Kelamin" subtitle="Distribusi gender">
          <DepartmentBarChart data={genderDistribution} />
        </Card>
        <Card title="Distribusi Rating KPI" subtitle={latestPeriod} className="sm:col-span-2">
          <DepartmentBarChart data={ratingDistribution} sortDescending={false} />
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card title="Skor KPI per Departemen" subtitle={`Rata-rata skor akhir — periode ${latestPeriod}`}>
          <KpiScoreChart data={kpiByDepartment} />
        </Card>
        <Card title="Top Performer" subtitle={`Karyawan dengan skor KPI tertinggi — ${latestPeriod}`} className="xl:col-span-2">
          <DataTable columns={columns} rows={topPerformers} pageSize={6} />
        </Card>
      </div>
    </AppShell>
  )
}

function ActionTile({ to, label, value, hint }: { to: string; label: string; value: number; hint?: string }) {
  const badgeTone = value === 0 ? 'good' : 'warning'
  return (
    <Link
      to={to}
      className="flex flex-col justify-between rounded-lg border p-3.5 transition-colors hover:bg-[var(--page-plane)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <Badge tone={badgeTone}>{value === 0 ? 'Selesai' : value}</Badge>
      </div>
      {hint && <div className="mt-2 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{hint}</div>}
    </Link>
  )
}
