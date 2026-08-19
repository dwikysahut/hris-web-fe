import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, chartColors, tooltipStyle } from './chartTheme'

export interface DeptDatum {
  department: string
  value: number
}

export function DepartmentBarChart({
  data,
  valueLabel = 'Karyawan',
  sortDescending = true,
}: {
  data: DeptDatum[]
  valueLabel?: string
  sortDescending?: boolean
}) {
  const sorted = sortDescending ? [...data].sort((a, b) => b.value - a.value) : data

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap={10}>
        <CartesianGrid stroke={chartColors.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          domain={[0, 'dataMax']}
          padding={{ right: 24 }}
        />
        <YAxis
          type="category"
          dataKey="department"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip
          cursor={{ fill: 'rgba(11,11,11,0.03)' }}
          contentStyle={tooltipStyle}
          formatter={(value) => [`${Number(value).toLocaleString('id-ID')}`, valueLabel]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={chartColors.series[0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
