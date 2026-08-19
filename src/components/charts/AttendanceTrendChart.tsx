import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, chartColors, tooltipStyle } from './chartTheme'

export interface TrendPoint {
  date: string
  label: string
  hadirPct: number
  terlambatPct: number
}

export function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="hadirFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.series[0]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={chartColors.series[0]} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="terlambatFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.series[4]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={chartColors.series[4]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: chartColors.grid }} tickLine={false} minTickGap={24} />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={44}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="hadirPct"
          name="Hadir"
          stroke={chartColors.series[0]}
          strokeWidth={2}
          fill="url(#hadirFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-1)' }}
        />
        <Area
          type="monotone"
          dataKey="terlambatPct"
          name="Terlambat"
          stroke={chartColors.series[4]}
          strokeWidth={2}
          fill="url(#terlambatFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-1)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
