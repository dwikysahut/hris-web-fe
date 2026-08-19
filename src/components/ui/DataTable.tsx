import { useMemo, useState } from 'react'
import { classNames } from '../../lib/utils'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
}

export function DataTable<T>({
  columns,
  rows,
  pageSize = 10,
  emptyLabel = 'Tidak ada data',
}: {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  emptyLabel?: string
}) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const clampedPage = Math.min(page, totalPages - 1)
  const pageRows = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize)

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
    setPage(0)
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={classNames(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortValue ? 'cursor-pointer select-none hover:text-[var(--text-secondary)]' : ''
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                  {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {pageRows.map((row, i) => (
              <tr
                key={i}
                className="border-b last:border-b-0 hover:bg-[var(--page-plane)]"
                style={{ borderColor: 'var(--gridline)' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={classNames(
                      'px-4 py-3 align-middle text-[var(--text-primary)]',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Menampilkan {clampedPage * pageSize + 1}–{Math.min(sorted.length, (clampedPage + 1) * pageSize)} dari{' '}
            {sorted.length} data
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              className="rounded-md border px-2.5 py-1 font-medium disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}
            >
              Sebelumnya
            </button>
            <span className="tabular-nums">
              {clampedPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              className="rounded-md border px-2.5 py-1 font-medium disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
