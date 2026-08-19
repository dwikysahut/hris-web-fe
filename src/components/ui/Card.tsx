import type { ReactNode } from 'react'
import { classNames } from '../../lib/utils'

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div
      className={classNames(
        'rounded-xl border bg-[var(--surface-1)] p-5 shadow-sm',
        className
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
