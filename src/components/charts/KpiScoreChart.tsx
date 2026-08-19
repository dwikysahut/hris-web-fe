import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, chartColors, tooltipStyle } from './chartTheme'

export interface KpiDatum {
  label: string
  score: number
}

function scoreColor(score: number) {
  if (score >= 85) return 'var(--status-good)'
  if (score >= 70) return chartColors.series[0]
  if (score >= 55) return 'var(--status-warning)'
  return 'var(--status-critical)'
}

export function KpiScoreChart({ data, height = 280 }: { data: KpiDatum[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }} barCategoryGap={12}>
        <CartesianGrid stroke={chartColors.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={axisTick} axisLine={false} tickLine={false} width={130} />
        <Tooltip
          cursor={{ fill: 'rgba(11,11,11,0.03)' }}
          contentStyle={tooltipStyle}
          formatter={(value) => [`${Number(value)}`, 'Skor']}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={scoreColor(d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
