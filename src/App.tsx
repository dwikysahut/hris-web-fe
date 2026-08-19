import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { DataProvider } from './lib/dataStore'
import { AuthProvider, useAuth } from './lib/authStore'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HeadcountDashboard from './pages/dashboards/HeadcountDashboard'
import TurnoverDashboard from './pages/dashboards/TurnoverDashboard'
import AttendanceDashboard from './pages/dashboards/AttendanceDashboard'
import LeaveDashboard from './pages/dashboards/LeaveDashboard'
import OvertimeDashboard from './pages/dashboards/OvertimeDashboard'
import PayrollSummaryDashboard from './pages/dashboards/PayrollSummaryDashboard'

import Employees from './pages/Employees'
import EmployeeProfile from './pages/EmployeeProfile'
import OrgChart from './pages/OrgChart'
import Position from './pages/Position'
import DepartmentList from './pages/DepartmentList'
import EmploymentStatus from './pages/EmploymentStatus'

import Attendance from './pages/Attendance'
import ShiftSchedule from './pages/ShiftSchedule'
import AttendanceMonitoring from './pages/AttendanceMonitoring'
import LateEarlyLeave from './pages/LateEarlyLeave'
import Absence from './pages/Absence'
import Overtime from './pages/Overtime'
import AttendanceAnalytics from './pages/analytics/AttendanceAnalytics'

import LeaveManagement from './pages/LeaveManagement'
import LeaveApproval from './pages/LeaveApproval'
import LeaveBalance from './pages/LeaveBalance'
import LeaveCalendar from './pages/LeaveCalendar'
import LeaveAnalytics from './pages/analytics/LeaveAnalytics'
import Reimbursement from './pages/Reimbursement'

import Payroll from './pages/Payroll'
import Salary from './pages/Salary'
import Allowance from './pages/Allowance'
import Deduction from './pages/Deduction'
import Payslip from './pages/Payslip'
import PayrollAnalytics from './pages/analytics/PayrollAnalytics'

import Performance from './pages/Performance'
import PerformanceReviewPage from './pages/PerformanceReviewPage'
import GoalObjective from './pages/GoalObjective'
import Assessment from './pages/Assessment'
import PerformanceAnalytics from './pages/analytics/PerformanceAnalytics'

import PeopleAnalytics from './pages/analytics/PeopleAnalytics'
import CustomReports from './pages/CustomReports'

import UserManagement from './pages/UserManagement'
import RolePermission from './pages/RolePermission'
import Workflow from './pages/Workflow'
import MasterData from './pages/MasterData'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'

import Training from './pages/Training'
import Documents from './pages/Documents'
import Announcements from './pages/Announcements'
import BulkImport from './pages/BulkImport'

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
          {/* Executive Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard/headcount" element={<HeadcountDashboard />} />
          <Route path="/dashboard/turnover" element={<TurnoverDashboard />} />
          <Route path="/dashboard/attendance" element={<AttendanceDashboard />} />
          <Route path="/dashboard/leave" element={<LeaveDashboard />} />
          <Route path="/dashboard/overtime" element={<OvertimeDashboard />} />
          <Route path="/dashboard/payroll" element={<PayrollSummaryDashboard />} />

          {/* People */}
          <Route path="/karyawan" element={<Employees />} />
          <Route path="/karyawan/:id" element={<EmployeeProfile />} />
          <Route path="/struktur-organisasi" element={<OrgChart />} />
          <Route path="/posisi" element={<Position />} />
          <Route path="/departemen" element={<DepartmentList />} />
          <Route path="/status-kepegawaian" element={<EmploymentStatus />} />

          {/* Attendance */}
          <Route path="/absensi" element={<Attendance />} />
          <Route path="/pemantauan-absensi" element={<AttendanceMonitoring />} />
          <Route path="/jadwal-shift" element={<ShiftSchedule />} />
          <Route path="/keterlambatan" element={<LateEarlyLeave />} />
          <Route path="/ketidakhadiran" element={<Absence />} />
          <Route path="/lembur" element={<Overtime />} />
          <Route path="/analitik-absensi" element={<AttendanceAnalytics />} />

          {/* Leave & Time Off */}
          <Route path="/cuti" element={<LeaveManagement />} />
          <Route path="/persetujuan-cuti" element={<LeaveApproval />} />
          <Route path="/saldo-cuti" element={<LeaveBalance />} />
          <Route path="/kalender-cuti" element={<LeaveCalendar />} />
          <Route path="/analitik-cuti" element={<LeaveAnalytics />} />
          <Route path="/reimbursement" element={<Reimbursement />} />

          {/* Payroll */}
          <Route path="/penggajian" element={<Payroll />} />
          <Route path="/struktur-gaji" element={<Salary />} />
          <Route path="/tunjangan" element={<Allowance />} />
          <Route path="/potongan" element={<Deduction />} />
          <Route path="/slip-gaji" element={<Payslip />} />
          <Route path="/analitik-payroll" element={<PayrollAnalytics />} />

          {/* Performance */}
          <Route path="/kinerja" element={<Performance />} />
          <Route path="/penilaian-kinerja" element={<PerformanceReviewPage />} />
          <Route path="/goal-objective" element={<GoalObjective />} />
          <Route path="/asesmen" element={<Assessment />} />
          <Route path="/analitik-kinerja" element={<PerformanceAnalytics />} />

          {/* Analytics */}
          <Route path="/analitik-people" element={<PeopleAnalytics />} />
          <Route path="/analitik-turnover" element={<TurnoverDashboard />} />
          <Route path="/laporan-kustom" element={<CustomReports />} />

          {/* Administration */}
          <Route path="/manajemen-pengguna" element={<UserManagement />} />
          <Route path="/peran-akses" element={<RolePermission />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/data-master" element={<MasterData />} />
          <Route path="/log-aktivitas" element={<AuditLog />} />
          <Route path="/pengaturan" element={<Settings />} />

          {/* Lainnya */}
          <Route path="/pelatihan" element={<Training />} />
          <Route path="/dokumen" element={<Documents />} />
          <Route path="/pengumuman" element={<Announcements />} />
          <Route path="/import" element={<BulkImport />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DataProvider>
  )
}
