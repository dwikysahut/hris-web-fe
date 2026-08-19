import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, chartColors, tooltipStyle } from './chartTheme'

export interface TrendLinePoint {
  label: string
  value: number
}

export function TrendLineChart({
  data,
  name = 'Nilai',
  valueFormatter,
  color = chartColors.series[0],
}: {
  data: TrendLinePoint[]
  name?: string
  valueFormatter?: (v: number) => string
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} allowDecimals={false} domain={[0, 'dataMax']} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [valueFormatter ? valueFormatter(Number(value)) : Number(value).toLocaleString('id-ID'), name]}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4, fill: color, stroke: 'var(--surface-1)', strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
