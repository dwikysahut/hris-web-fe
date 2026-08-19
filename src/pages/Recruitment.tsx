import { useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge, approvalTone } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { makeId, useData } from '../lib/dataStore'
import { formatDate, initials } from '../lib/utils'
import type { Candidate, CandidateStage, Department, JobOpening } from '../lib/types'

const STAGES: CandidateStage[] = ['Lamaran Masuk', 'Screening', 'Interview', 'Penawaran', 'Diterima', 'Ditolak']
const FUNNEL_STAGES: CandidateStage[] = ['Lamaran Masuk', 'Screening', 'Interview', 'Penawaran', 'Diterima']
const DEPARTMENTS: Department[] = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
]
const EMPLOYMENT_TYPES: JobOpening['employmentType'][] = ['Full-time', 'Kontrak', 'Magang']
const JOB_STATUSES: JobOpening['status'][] = ['Dibuka', 'Ditutup']
const SOURCES: Candidate['source'][] = ['LinkedIn', 'Jobstreet', 'Referensi Karyawan', 'Website Karir', 'Glints']

const BLANK_JOB_FORM = {
  title: '',
  department: DEPARTMENTS[0],
  location: '',
  employmentType: 'Full-time' as JobOpening['employmentType'],
  openings: 1,
  status: 'Dibuka' as JobOpening['status'],
  postedAt: new Date().toISOString().slice(0, 10),
  applicants: 0,
}

const BLANK_CANDIDATE_FORM = {
  name: '',
  jobId: '',
  email: '',
  stage: 'Lamaran Masuk' as CandidateStage,
  appliedAt: new Date().toISOString().slice(0, 10),
  source: 'LinkedIn' as Candidate['source'],
  score: 0,
}

export default function Recruitment() {
  const {
    jobOpenings,
    candidates,
    setCandidateStage,
    addJobOpening,
    updateJobOpening,
    deleteJobOpening,
    addCandidate,
    updateCandidate,
    deleteCandidate,
  } = useData()
  const [jobFilter, setJobFilter] = useState('Semua')
  const [stageFilter, setStageFilter] = useState('Semua')

  const [jobFormOpen, setJobFormOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [jobForm, setJobForm] = useState(BLANK_JOB_FORM)
  const [jobDeleteTarget, setJobDeleteTarget] = useState<JobOpening | null>(null)

  const [candidateFormOpen, setCandidateFormOpen] = useState(false)
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)
  const [candidateForm, setCandidateForm] = useState(BLANK_CANDIDATE_FORM)
  const [candidateDeleteTarget, setCandidateDeleteTarget] = useState<Candidate | null>(null)

  const openJobs = jobOpenings.filter((j) => j.status === 'Dibuka')
  const totalApplicants = candidates.length
  const inProcess = candidates.filter((c) => !['Diterima', 'Ditolak'].includes(c.stage)).length
  const hired = candidates.filter((c) => c.stage === 'Diterima').length

  const funnel = useMemo(() => {
    const max = Math.max(...FUNNEL_STAGES.map((s) => candidates.filter((c) => c.stage === s || FUNNEL_STAGES.indexOf(c.stage) >= FUNNEL_STAGES.indexOf(s)).length), 1)
    return FUNNEL_STAGES.map((stage) => {
      const count = candidates.filter((c) => FUNNEL_STAGES.indexOf(c.stage) >= FUNNEL_STAGES.indexOf(stage) || c.stage === 'Diterima').length
      return { stage, count, pct: (count / max) * 100 }
    })
  }, [candidates])

  const filteredCandidates = useMemo(
    () =>
      candidates.filter(
        (c) => (jobFilter === 'Semua' || c.jobId === jobFilter) && (stageFilter === 'Semua' || c.stage === stageFilter)
      ),
    [candidates, jobFilter, stageFilter]
  )

  const openCreateJob = () => {
    setEditingJobId(null)
    setJobForm(BLANK_JOB_FORM)
    setJobFormOpen(true)
  }

  const openEditJob = (job: JobOpening) => {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      openings: job.openings,
      status: job.status,
      postedAt: job.postedAt,
      applicants: job.applicants,
    })
    setJobFormOpen(true)
  }

  const handleJobSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingJobId) {
      updateJobOpening(editingJobId, jobForm)
    } else {
      addJobOpening({ id: makeId('JOB'), ...jobForm })
    }
    setJobFormOpen(false)
  }

  const confirmDeleteJob = () => {
    if (jobDeleteTarget) deleteJobOpening(jobDeleteTarget.id)
    setJobDeleteTarget(null)
  }

  const openCreateCandidate = () => {
    setEditingCandidateId(null)
    setCandidateForm({ ...BLANK_CANDIDATE_FORM, jobId: jobOpenings[0]?.id ?? '' })
    setCandidateFormOpen(true)
  }

  const openEditCandidate = (candidate: Candidate) => {
    setEditingCandidateId(candidate.id)
    setCandidateForm({
      name: candidate.name,
      jobId: candidate.jobId,
      email: candidate.email,
      stage: candidate.stage,
      appliedAt: candidate.appliedAt,
      source: candidate.source,
      score: candidate.score,
    })
    setCandidateFormOpen(true)
  }

  const handleCandidateSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editingCandidateId) {
      updateCandidate(editingCandidateId, candidateForm)
    } else {
      addCandidate({ id: makeId('CAND'), ...candidateForm })
    }
    setCandidateFormOpen(false)
  }

  const confirmDeleteCandidate = () => {
    if (candidateDeleteTarget) deleteCandidate(candidateDeleteTarget.id)
    setCandidateDeleteTarget(null)
  }

  const jobColumns: Column<JobOpening>[] = [
    { key: 'title', header: 'Posisi', render: (j) => <span className="font-medium">{j.title}</span>, sortValue: (j) => j.title },
    { key: 'department', header: 'Departemen', render: (j) => j.department },
    { key: 'location', header: 'Lokasi', render: (j) => j.location },
    { key: 'employmentType', header: 'Tipe', render: (j) => j.employmentType },
    { key: 'openings', header: 'Kuota', align: 'right', render: (j) => j.openings, sortValue: (j) => j.openings },
    { key: 'applicants', header: 'Pelamar', align: 'right', render: (j) => j.applicants, sortValue: (j) => j.applicants },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (j) => <Badge tone={approvalTone(j.status)}>{j.status}</Badge>,
      sortValue: (j) => j.status,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (j) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditJob(j)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setJobDeleteTarget(j)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  const candidateColumns: Column<Candidate>[] = [
    {
      key: 'name',
      header: 'Kandidat',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: 'var(--series-3)' }}>
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{c.email}</div>
          </div>
        </div>
      ),
      sortValue: (c) => c.name,
    },
    {
      key: 'job',
      header: 'Posisi Dilamar',
      render: (c) => jobOpenings.find((j) => j.id === c.jobId)?.title ?? '-',
    },
    { key: 'source', header: 'Sumber', render: (c) => c.source },
    { key: 'appliedAt', header: 'Tanggal Lamar', render: (c) => formatDate(c.appliedAt), sortValue: (c) => c.appliedAt },
    { key: 'score', header: 'Skor', align: 'right', render: (c) => c.score, sortValue: (c) => c.score },
    {
      key: 'stage',
      header: 'Tahapan',
      align: 'center',
      render: (c) => (
        <select
          value={c.stage}
          onChange={(e) => setCandidateStage(c.id, e.target.value as CandidateStage)}
          className="rounded-md border px-2 py-1 text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      ),
      sortValue: (c) => c.stage,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditCandidate(c)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Ubah
          </button>
          <button
            onClick={() => setCandidateDeleteTarget(c)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--page-plane)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppShell title="Rekrutmen" subtitle="Lowongan pekerjaan dan pipeline kandidat">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lowongan Dibuka" value={openJobs.length.toLocaleString('id-ID')} />
        <StatCard label="Total Pelamar" value={totalApplicants.toLocaleString('id-ID')} />
        <StatCard label="Dalam Proses" value={inProcess.toLocaleString('id-ID')} />
        <StatCard label="Diterima" value={hired.toLocaleString('id-ID')} deltaLabel="periode berjalan" />
      </div>

      <Card className="mt-4" title="Corong Rekrutmen" subtitle="Jumlah kandidat yang mencapai setiap tahapan">
        <div className="space-y-2.5">
          {funnel.map((f) => (
            <div key={f.stage} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-[var(--text-secondary)]">{f.stage}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-md" style={{ background: 'var(--page-plane)' }}>
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 text-xs font-semibold text-white"
                  style={{ width: `${Math.max(f.pct, 8)}%`, background: 'var(--series-1)' }}
                >
                  {f.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4" title="Lowongan Pekerjaan">
        <div className="mb-4 flex justify-end">
          <button
            onClick={openCreateJob}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Lowongan
          </button>
        </div>
        <DataTable columns={jobColumns} rows={jobOpenings} pageSize={6} emptyLabel="Tidak ada lowongan" />
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="Semua">Semua Posisi</option>
              {jobOpenings.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="Semua">Semua Tahapan</option>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreateCandidate}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--series-1)' }}
          >
            + Tambah Kandidat
          </button>
        </div>
        <DataTable columns={candidateColumns} rows={filteredCandidates} pageSize={10} emptyLabel="Tidak ada kandidat" />
      </Card>

      <Modal
        open={jobFormOpen}
        onClose={() => setJobFormOpen(false)}
        title={editingJobId ? 'Ubah Lowongan' : 'Tambah Lowongan'}
        subtitle={editingJobId ? 'Perbarui data lowongan pekerjaan' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleJobSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Judul Posisi">
            <input
              required
              value={jobForm.title}
              onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Departemen">
            <select
              value={jobForm.department}
              onChange={(e) => setJobForm((f) => ({ ...f, department: e.target.value as Department }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Lokasi">
            <input
              required
              value={jobForm.location}
              onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tipe Pekerjaan">
            <select
              value={jobForm.employmentType}
              onChange={(e) => setJobForm((f) => ({ ...f, employmentType: e.target.value as JobOpening['employmentType'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Kuota">
            <input
              required
              type="number"
              min={1}
              value={jobForm.openings}
              onChange={(e) => setJobForm((f) => ({ ...f, openings: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Status">
            <select
              value={jobForm.status}
              onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value as JobOpening['status'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {JOB_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Diposting">
            <input
              required
              type="date"
              value={jobForm.postedAt}
              onChange={(e) => setJobForm((f) => ({ ...f, postedAt: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Jumlah Pelamar">
            <input
              required
              type="number"
              min={0}
              value={jobForm.applicants}
              onChange={(e) => setJobForm((f) => ({ ...f, applicants: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>

          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setJobFormOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              {editingJobId ? 'Simpan Perubahan' : 'Tambah Lowongan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!jobDeleteTarget}
        onClose={() => setJobDeleteTarget(null)}
        title="Hapus Lowongan"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{jobDeleteTarget?.title}</span> dari
          daftar lowongan?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setJobDeleteTarget(null)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Batal
          </button>
          <button
            onClick={confirmDeleteJob}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--status-critical)' }}
          >
            Hapus
          </button>
        </div>
      </Modal>

      <Modal
        open={candidateFormOpen}
        onClose={() => setCandidateFormOpen(false)}
        title={editingCandidateId ? 'Ubah Kandidat' : 'Tambah Kandidat'}
        subtitle={editingCandidateId ? 'Perbarui data kandidat' : 'Data akan disimpan sebagai data simulasi'}
      >
        <form onSubmit={handleCandidateSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Nama Kandidat">
            <input
              required
              value={candidateForm.name}
              onChange={(e) => setCandidateForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Email">
            <input
              required
              type="email"
              value={candidateForm.email}
              onChange={(e) => setCandidateForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Posisi Dilamar">
            <select
              required
              value={candidateForm.jobId}
              onChange={(e) => setCandidateForm((f) => ({ ...f, jobId: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="" disabled>
                Pilih posisi
              </option>
              {jobOpenings.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Sumber">
            <select
              value={candidateForm.source}
              onChange={(e) => setCandidateForm((f) => ({ ...f, source: e.target.value as Candidate['source'] }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Lamar">
            <input
              required
              type="date"
              value={candidateForm.appliedAt}
              onChange={(e) => setCandidateForm((f) => ({ ...f, appliedAt: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Skor">
            <input
              required
              type="number"
              min={0}
              max={100}
              value={candidateForm.score}
              onChange={(e) => setCandidateForm((f) => ({ ...f, score: Number(e.target.value) }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </FormField>
          <FormField label="Tahapan">
            <select
              value={candidateForm.stage}
              onChange={(e) => setCandidateForm((f) => ({ ...f, stage: e.target.value as CandidateStage }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setCandidateFormOpen(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--series-1)' }}
            >
              {editingCandidateId ? 'Simpan Perubahan' : 'Tambah Kandidat'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!candidateDeleteTarget}
        onClose={() => setCandidateDeleteTarget(null)}
        title="Hapus Kandidat"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Yakin ingin menghapus <span className="font-medium text-[var(--text-primary)]">{candidateDeleteTarget?.name}</span> dari
          data kandidat?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setCandidateDeleteTarget(null)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Batal
          </button>
          <button
            onClick={confirmDeleteCandidate}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--status-critical)' }}
          >
            Hapus
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  )
}
