import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  generateAnnouncements,
  generateAttendance,
  generateAuditLog,
  generateCandidates,
  generateDocuments,
  generateEmployees,
  generateExpenseClaims,
  generateImportLog,
  generateJobOpenings,
  generateKpi,
  generateLeaveRequests,
  generateOvertimeRequests,
  generatePayroll,
  generatePerformanceGoals,
  generatePerformanceReviews,
  generateShiftAssignments,
  generateSystemUsers,
  generateTrainingParticipants,
  generateTrainingPrograms,
  generateWorkflows,
} from './generateData'
import type {
  Announcement,
  ApprovalStatus,
  AttendanceRecord,
  AuditLogEntry,
  Candidate,
  CandidateStage,
  Employee,
  EmployeeDocument,
  ExpenseClaim,
  ImportLogEntry,
  JobOpening,
  KpiRecord,
  LeaveRequest,
  OvertimeRequest,
  PayrollRecord,
  PerformanceGoal,
  PerformanceReview,
  ShiftAssignment,
  SystemUser,
  TrainingParticipant,
  TrainingProgram,
  WorkflowConfig,
} from './types'

interface DataState {
  employees: Employee[]
  attendance: AttendanceRecord[]
  kpi: KpiRecord[]
  importLog: ImportLogEntry[]
  leaveRequests: LeaveRequest[]
  shiftAssignments: ShiftAssignment[]
  overtimeRequests: OvertimeRequest[]
  payroll: PayrollRecord[]
  expenseClaims: ExpenseClaim[]
  jobOpenings: JobOpening[]
  candidates: Candidate[]
  trainingPrograms: TrainingProgram[]
  trainingParticipants: TrainingParticipant[]
  documents: EmployeeDocument[]
  announcements: Announcement[]
  goals: PerformanceGoal[]
  reviews: PerformanceReview[]
  users: SystemUser[]
  auditLog: AuditLogEntry[]
  workflows: WorkflowConfig[]
  employeeMap: Map<string, Employee>
  addEmployees: (rows: Employee[]) => void
  updateEmployee: (id: string, patch: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  addAttendance: (rows: AttendanceRecord[]) => void
  addKpi: (rows: KpiRecord[]) => void
  pushImportLog: (entry: ImportLogEntry) => void
  setLeaveStatus: (id: string, status: ApprovalStatus) => void
  addLeaveRequest: (row: LeaveRequest) => void
  updateLeaveRequest: (id: string, patch: Partial<LeaveRequest>) => void
  deleteLeaveRequest: (id: string) => void
  setOvertimeStatus: (id: string, status: ApprovalStatus) => void
  addOvertimeRequest: (row: OvertimeRequest) => void
  updateOvertimeRequest: (id: string, patch: Partial<OvertimeRequest>) => void
  deleteOvertimeRequest: (id: string) => void
  setClaimStatus: (id: string, status: ApprovalStatus) => void
  addExpenseClaim: (row: ExpenseClaim) => void
  updateExpenseClaim: (id: string, patch: Partial<ExpenseClaim>) => void
  deleteExpenseClaim: (id: string) => void
  addShiftAssignment: (row: ShiftAssignment) => void
  updateShiftAssignment: (id: string, patch: Partial<ShiftAssignment>) => void
  deleteShiftAssignment: (id: string) => void
  setCandidateStage: (id: string, stage: CandidateStage) => void
  addJobOpening: (row: JobOpening) => void
  updateJobOpening: (id: string, patch: Partial<JobOpening>) => void
  deleteJobOpening: (id: string) => void
  addCandidate: (row: Candidate) => void
  updateCandidate: (id: string, patch: Partial<Candidate>) => void
  deleteCandidate: (id: string) => void
  addTrainingProgram: (row: TrainingProgram) => void
  updateTrainingProgram: (id: string, patch: Partial<TrainingProgram>) => void
  deleteTrainingProgram: (id: string) => void
  addDocument: (row: EmployeeDocument) => void
  updateDocument: (id: string, patch: Partial<EmployeeDocument>) => void
  deleteDocument: (id: string) => void
  addAnnouncement: (row: Announcement) => void
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void
  addGoal: (row: PerformanceGoal) => void
  updateGoal: (id: string, patch: Partial<PerformanceGoal>) => void
  deleteGoal: (id: string) => void
  addReview: (row: PerformanceReview) => void
  updateReview: (id: string, patch: Partial<PerformanceReview>) => void
  deleteReview: (id: string) => void
  setUserStatus: (id: string, status: SystemUser['status']) => void
  addUser: (row: SystemUser) => void
  updateUser: (id: string, patch: Partial<SystemUser>) => void
  deleteUser: (id: string) => void
  setWorkflowActive: (id: string, active: boolean) => void
  addWorkflow: (row: WorkflowConfig) => void
  updateWorkflow: (id: string, patch: Partial<WorkflowConfig>) => void
  deleteWorkflow: (id: string) => void
  addPayrollRecord: (row: PayrollRecord) => void
  updatePayrollRecord: (id: string, patch: Partial<PayrollRecord>) => void
  deletePayrollRecord: (id: string) => void
}

const DataContext = createContext<DataState | null>(null)

let idCounter = 900000
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

const seedEmployees = generateEmployees()
const seedEmployeeMap = new Map(seedEmployees.map((e) => [e.id, e]))
const seedAttendance = generateAttendance(seedEmployees)
const seedKpi = generateKpi(seedEmployees)
const seedLeaveRequests = generateLeaveRequests(seedEmployees)
const seedShiftAssignments = generateShiftAssignments(seedEmployees)
const seedOvertimeRequests = generateOvertimeRequests(seedEmployees)
const seedPayroll = generatePayroll(seedEmployees)
const seedExpenseClaims = generateExpenseClaims(seedEmployees)
const seedJobOpenings = generateJobOpenings()
const seedCandidates = generateCandidates(seedJobOpenings)
const seedTrainingPrograms = generateTrainingPrograms()
const seedTrainingParticipants = generateTrainingParticipants(seedTrainingPrograms, seedEmployees)
const seedDocuments = generateDocuments(seedEmployees)
const seedAnnouncements = generateAnnouncements()
const seedGoals = generatePerformanceGoals(seedEmployees)
const seedReviews = generatePerformanceReviews(seedKpi)
const seedUsers = generateSystemUsers(seedEmployees)
const seedAuditLog = generateAuditLog(seedUsers, seedEmployeeMap)
const seedWorkflows = generateWorkflows()

export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(seedAttendance)
  const [kpi, setKpi] = useState<KpiRecord[]>(seedKpi)
  const [importLog, setImportLog] = useState<ImportLogEntry[]>(() => generateImportLog())
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(seedLeaveRequests)
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(seedShiftAssignments)
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(seedOvertimeRequests)
  const [payroll, setPayroll] = useState<PayrollRecord[]>(seedPayroll)
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(seedExpenseClaims)
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>(seedJobOpenings)
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates)
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>(seedTrainingPrograms)
  const [trainingParticipants] = useState<TrainingParticipant[]>(seedTrainingParticipants)
  const [documents, setDocuments] = useState<EmployeeDocument[]>(seedDocuments)
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements)
  const [goals, setGoals] = useState<PerformanceGoal[]>(seedGoals)
  const [reviews, setReviews] = useState<PerformanceReview[]>(seedReviews)
  const [users, setUsers] = useState<SystemUser[]>(seedUsers)
  const [auditLog] = useState<AuditLogEntry[]>(seedAuditLog)
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>(seedWorkflows)

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])

  const value: DataState = {
    employees,
    attendance,
    kpi,
    importLog,
    leaveRequests,
    shiftAssignments,
    overtimeRequests,
    payroll,
    expenseClaims,
    jobOpenings,
    candidates,
    trainingPrograms,
    trainingParticipants,
    documents,
    announcements,
    goals,
    reviews,
    users,
    auditLog,
    workflows,
    employeeMap,
    addEmployees: (rows) => setEmployees((prev) => [...rows, ...prev]),
    updateEmployee: (id, patch) =>
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    deleteEmployee: (id) => setEmployees((prev) => prev.filter((e) => e.id !== id)),
    addAttendance: (rows) => setAttendance((prev) => [...rows, ...prev]),
    addKpi: (rows) => setKpi((prev) => [...rows, ...prev]),
    pushImportLog: (entry) => setImportLog((prev) => [entry, ...prev]),
    setLeaveStatus: (id, status) =>
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))),
    addLeaveRequest: (row) => setLeaveRequests((prev) => [row, ...prev]),
    updateLeaveRequest: (id, patch) =>
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    deleteLeaveRequest: (id) => setLeaveRequests((prev) => prev.filter((r) => r.id !== id)),

    setOvertimeStatus: (id, status) =>
      setOvertimeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))),
    addOvertimeRequest: (row) => setOvertimeRequests((prev) => [row, ...prev]),
    updateOvertimeRequest: (id, patch) =>
      setOvertimeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    deleteOvertimeRequest: (id) => setOvertimeRequests((prev) => prev.filter((r) => r.id !== id)),

    setClaimStatus: (id, status) =>
      setExpenseClaims((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))),
    addExpenseClaim: (row) => setExpenseClaims((prev) => [row, ...prev]),
    updateExpenseClaim: (id, patch) =>
      setExpenseClaims((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    deleteExpenseClaim: (id) => setExpenseClaims((prev) => prev.filter((r) => r.id !== id)),

    addShiftAssignment: (row) => setShiftAssignments((prev) => [row, ...prev]),
    updateShiftAssignment: (id, patch) =>
      setShiftAssignments((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    deleteShiftAssignment: (id) => setShiftAssignments((prev) => prev.filter((r) => r.id !== id)),

    setCandidateStage: (id, stage) =>
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c))),
    addCandidate: (row) => setCandidates((prev) => [row, ...prev]),
    updateCandidate: (id, patch) =>
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    deleteCandidate: (id) => setCandidates((prev) => prev.filter((c) => c.id !== id)),

    addJobOpening: (row) => setJobOpenings((prev) => [row, ...prev]),
    updateJobOpening: (id, patch) =>
      setJobOpenings((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j))),
    deleteJobOpening: (id) => setJobOpenings((prev) => prev.filter((j) => j.id !== id)),

    addTrainingProgram: (row) => setTrainingPrograms((prev) => [row, ...prev]),
    updateTrainingProgram: (id, patch) =>
      setTrainingPrograms((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    deleteTrainingProgram: (id) => setTrainingPrograms((prev) => prev.filter((t) => t.id !== id)),

    addDocument: (row) => setDocuments((prev) => [row, ...prev]),
    updateDocument: (id, patch) =>
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    deleteDocument: (id) => setDocuments((prev) => prev.filter((d) => d.id !== id)),

    addAnnouncement: (row) => setAnnouncements((prev) => [row, ...prev]),
    updateAnnouncement: (id, patch) =>
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    deleteAnnouncement: (id) => setAnnouncements((prev) => prev.filter((a) => a.id !== id)),

    addGoal: (row) => setGoals((prev) => [row, ...prev]),
    updateGoal: (id, patch) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    deleteGoal: (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),

    addReview: (row) => setReviews((prev) => [row, ...prev]),
    updateReview: (id, patch) => setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    deleteReview: (id) => setReviews((prev) => prev.filter((r) => r.id !== id)),

    setUserStatus: (id, status) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))),
    addUser: (row) => setUsers((prev) => [row, ...prev]),
    updateUser: (id, patch) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u))),
    deleteUser: (id) => setUsers((prev) => prev.filter((u) => u.id !== id)),

    setWorkflowActive: (id, active) => setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, active } : w))),
    addWorkflow: (row) => setWorkflows((prev) => [row, ...prev]),
    updateWorkflow: (id, patch) => setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    deleteWorkflow: (id) => setWorkflows((prev) => prev.filter((w) => w.id !== id)),

    addPayrollRecord: (row) => setPayroll((prev) => [row, ...prev]),
    updatePayrollRecord: (id, patch) =>
      setPayroll((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    deletePayrollRecord: (id) => setPayroll((prev) => prev.filter((p) => p.id !== id)),
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function makeImportId() {
  return nextId('LOG')
}

export function makeEmployeeId() {
  return nextId('EMP')
}

export function makeId(prefix: string) {
  return nextId(prefix)
}
