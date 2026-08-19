import type { ReactNode } from 'react'
import { classNames } from '../../lib/utils'

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  positive = true,
  icon,
}: {
  label: string
  value: string
  delta?: string
  deltaLabel?: string
  positive?: boolean
  icon?: ReactNode
}) {
  return (
    <div
      className="rounded-xl border bg-[var(--surface-1)] p-5 shadow-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className="mt-2 truncate tabular-nums text-2xl font-semibold text-[var(--text-primary)]" title={value}>
        {value}
      </div>
      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={classNames('font-medium', positive ? '' : '')}
            style={{ color: positive ? 'var(--success-text)' : 'var(--status-critical)' }}
          >
            {positive ? '▲' : '▼'} {delta}
          </span>
          {deltaLabel && <span className="text-[var(--text-muted)]">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
