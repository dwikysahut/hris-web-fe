import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useData } from '../lib/dataStore'
import { classNames, initials } from '../lib/utils'

const MONTH = '2026-08'
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function LeaveCalendar() {
  const { leaveRequests, employeeMap } = useData()
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-19')

  const approved = useMemo(() => leaveRequests.filter((r) => r.status === 'Disetujui'), [leaveRequests])

  const byDate = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const r of approved) {
      const start = new Date(r.startDate)
      const end = new Date(r.endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10)
        if (!key.startsWith(MONTH)) continue
        const list = map.get(key) ?? []
        list.push(r.employeeId)
        map.set(key, list)
      }
    }
    return map
  }, [approved])

  const [year, month] = MONTH.split('-').map(Number)
  const totalDays = daysInMonth(year, month - 1)
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7 // Monday = 0

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)]

  const selectedEmployees = (byDate.get(selectedDate) ?? []).map((id) => employeeMap.get(id)).filter(Boolean)

  return (
    <AppShell title="Leave Calendar" subtitle="Kalender cuti karyawan — Agustus 2026">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Agustus 2026" subtitle="Klik tanggal untuk melihat siapa saja yang cuti">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />
              const dateStr = `${MONTH}-${String(day).padStart(2, '0')}`
              const count = byDate.get(dateStr)?.length ?? 0
              const isSelected = dateStr === selectedDate
              const isWeekend = (firstWeekday + day - 1) % 7 >= 5
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={classNames(
                    'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-colors',
                    isWeekend ? 'opacity-50' : ''
                  )}
                  style={{
                    borderColor: isSelected ? 'var(--series-1)' : 'var(--border)',
                    background: isSelected ? 'rgba(42,120,214,0.1)' : 'var(--surface-1)',
                  }}
                >
                  <span className="font-medium text-[var(--text-primary)]">{day}</span>
                  {count > 0 && (
                    <span
                      className="rounded-full px-1.5 text-[10px] font-semibold text-white"
                      style={{ background: 'var(--series-5)' }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card title={`Cuti pada ${selectedDate}`} subtitle={`${selectedEmployees.length} karyawan`}>
          {selectedEmployees.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Tidak ada karyawan yang cuti pada tanggal ini.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEmployees.map((emp) => (
                <div key={emp!.id} className="flex items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: 'var(--gridline)' }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-5)' }}>
                    {initials(emp!.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{emp!.name}</div>
                    <div className="truncate text-xs text-[var(--text-muted)]">{emp!.department}</div>
                  </div>
                  <Badge tone="neutral">Cuti</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
