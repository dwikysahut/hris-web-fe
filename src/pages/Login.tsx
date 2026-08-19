import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authStore'

const FEATURES = [
  {
    color: 'var(--series-1)',
    title: 'Data Karyawan Terpusat',
    desc: 'Profil, dokumen, dan struktur organisasi dalam satu tempat.',
    icon: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    ),
  },
  {
    color: 'var(--series-3)',
    title: 'Absensi & Cuti',
    desc: 'Pantau kehadiran, lembur, dan persetujuan cuti secara real-time.',
    icon: <path d="M8 3v4M16 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />,
  },
  {
    color: 'var(--series-4)',
    title: 'Payroll & Kinerja',
    desc: 'Otomatisasi penggajian dan penilaian KPI setiap periode.',
    icon: <path d="M3 17l5-5 4 4 8-8M14 8h6v6" />,
  },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('admin@hris.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = login(email, password)
    if (!ok) {
      setError('Email dan password wajib diisi')
      setSubmitting(false)
      return
    }
    setError('')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-plane)' }}>
      <div
        className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden border-r p-10 lg:flex xl:p-14"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(var(--gridline) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          {/* <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ background: 'var(--series-1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <path d="M15 13v22M33 13v22M15 24h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div> */}
          <span className="text-sm font-semibold text-[var(--text-primary)]">HRIS</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            Kelola SDM perusahaan Anda dalam satu platform.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Karyawan, absensi, cuti, payroll, hingga kinerja — terhubung dalam satu dashboard yang rapi dan mudah
            dipantau.
          </p>

          <div className="mt-9 flex flex-col gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                {/* <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: f.color }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {f.icon}
                  </svg>
                </div> */}
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{f.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[var(--text-muted)]">© 2023 HRIS</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: 'var(--series-1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M15 13v22M33 13v22M15 24h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">HRIS Admin</h1>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Selamat datang kembali</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Masuk untuk melanjutkan ke dashboard Anda</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border bg-[var(--surface-1)] p-6 shadow-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  <path d="M4 6h16v12H4V6Zm0 0 8 7 8-7" />
                </svg>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--series-1)]"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="nama@perusahaan.com"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-1">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-[var(--text-secondary)]">Password</label>
                <span className="text-xs text-[var(--text-muted)]">Lupa password?</span>
              </div>
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  <rect x="5" y="11" width="14" height="9" rx="1.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-[var(--series-1)]"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.4 6.6C4 8.3 2.5 10.5 2 12c1.4 3.7 5.4 7 10 7 1.6 0 3.1-.4 4.4-1.1M9.9 4.2A10.9 10.9 0 0 1 12 4c4.6 0 8.6 3.3 10 7-.5 1.3-1.3 2.6-2.3 3.6" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12c1.4-3.7 5.4-7 10-7s8.6 3.3 10 7c-1.4 3.7-5.4 7-10 7s-8.6-3.3-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="mb-1 mt-2 text-xs text-[var(--status-critical)]">{error}</p>}

            <label className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded"
                style={{ accentColor: 'var(--series-1)' }}
              />
              Ingat saya di perangkat ini
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ background: 'var(--series-1)' }}
            >
              Masuk
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <p className="mt-4 rounded-lg px-3 py-2 text-center text-xs text-[var(--text-muted)]" style={{ background: 'var(--page-plane)' }}>
              Mode demo — isi email &amp; password apa saja untuk masuk.
            </p>
          </form>

          <p className="mt-6 text-center text-[11px] text-[var(--text-muted)] lg:hidden">© 2023 HRIS</p>
        </div>
      </div>
    </div>
  )
}
