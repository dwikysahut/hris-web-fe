import { classNames } from '../../lib/utils'

type Tone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral'

const TONE_STYLES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  good: { bg: 'rgba(12,163,12,0.12)', fg: '#006300', dot: 'var(--status-good)' },
  warning: { bg: 'rgba(250,178,25,0.16)', fg: '#8a5a00', dot: 'var(--status-warning)' },
  serious: { bg: 'rgba(236,131,90,0.16)', fg: '#9c4620', dot: 'var(--status-serious)' },
  critical: { bg: 'rgba(208,59,59,0.12)', fg: 'var(--status-critical)', dot: 'var(--status-critical)' },
  neutral: { bg: 'rgba(11,11,11,0.06)', fg: 'var(--text-secondary)', dot: 'var(--text-muted)' },
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  const s = TONE_STYLES[tone]
  return (
    <span
      className={classNames('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', className)}
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
      {children}
    </span>
  )
}

export function attendanceTone(status: string): Tone {
  switch (status) {
    case 'Hadir':
    case 'WFH':
      return 'good'
    case 'Terlambat':
      return 'warning'
    case 'Izin':
    case 'Cuti':
    case 'Sakit':
      return 'serious'
    case 'Alpha':
      return 'critical'
    default:
      return 'neutral'
  }
}

export function ratingTone(rating: string): Tone {
  switch (rating) {
    case 'A':
      return 'good'
    case 'B':
      return 'neutral'
    case 'C':
      return 'warning'
    case 'D':
      return 'critical'
    default:
      return 'neutral'
  }
}

export function employeeStatusTone(status: string): Tone {
  switch (status) {
    case 'Aktif':
      return 'good'
    case 'Cuti Panjang':
      return 'warning'
    case 'Nonaktif':
      return 'critical'
    default:
      return 'neutral'
  }
}

export function approvalTone(status: string): Tone {
  switch (status) {
    case 'Disetujui':
    case 'Diterima':
    case 'Dibayar':
    case 'Sukses':
      return 'good'
    case 'Menunggu':
    case 'Diproses':
    case 'Draft':
    case 'Screening':
    case 'Interview':
    case 'Penawaran':
    case 'Terjadwal':
      return 'warning'
    case 'Ditolak':
    case 'Ditutup':
      return 'critical'
    default:
      return 'neutral'
  }
}
