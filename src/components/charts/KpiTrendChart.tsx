import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, chartColors, tooltipStyle } from './chartTheme'

export interface KpiTrendPoint {
  period: string
  label: string
  avgScore: number
}

export function KpiTrendChart({ data }: { data: KpiTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} domain={[0, 100]} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [Number(value).toFixed(1), 'Rata-rata Skor']}
        />
        <Line
          type="monotone"
          dataKey="avgScore"
          name="Rata-rata Skor KPI"
          stroke={chartColors.series[0]}
          strokeWidth={2}
          dot={{ r: 4, fill: chartColors.series[0], stroke: 'var(--surface-1)', strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
