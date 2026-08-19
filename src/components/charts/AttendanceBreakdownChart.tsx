import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartColors, axisTick, tooltipStyle } from './chartTheme'
import type { AttendanceStatus } from '../../lib/types'

export interface BreakdownDatum {
  department: string
  Hadir: number
  WFH: number
  Terlambat: number
  Izin: number
  Sakit: number
  Cuti: number
  Alpha: number
}

const STATUS_ORDER: AttendanceStatus[] = ['Hadir', 'WFH', 'Terlambat', 'Izin', 'Sakit', 'Cuti', 'Alpha']
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  Hadir: chartColors.series[0],
  WFH: chartColors.series[2],
  Terlambat: chartColors.series[3],
  Izin: chartColors.series[4],
  Sakit: chartColors.series[1],
  Cuti: chartColors.series[6],
  Alpha: chartColors.series[7],
}

export function AttendanceBreakdownChart({ data }: { data: BreakdownDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap={14}>
        <CartesianGrid stroke={chartColors.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
        />
        <YAxis type="category" dataKey="department" tick={axisTick} axisLine={false} tickLine={false} width={130} />
        <Tooltip
          cursor={{ fill: 'rgba(11,11,11,0.03)' }}
          contentStyle={tooltipStyle}
          formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 8 }} />
        {STATUS_ORDER.map((status) => (
          <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLOR[status]} maxBarSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
