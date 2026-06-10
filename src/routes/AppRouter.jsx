import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Auth pages
import LoginPage    from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// Layouts
import AdminLayout   from '../layouts/AdminLayout'
import StudentLayout from '../layouts/StudentLayout'

// Admin pages
import AdminDashboard      from '../pages/admin/AdminDashboard'
import StudentManagement   from '../pages/admin/StudentManagement'
import CourseManagement    from '../pages/admin/CourseManagement'
import AttendanceManagement from '../pages/admin/AttendanceManagement'
import QRAttendance        from '../pages/admin/QRAttendance'
import ReportsPage         from '../pages/admin/ReportsPage'
import FaceRecognition     from '../pages/admin/FaceRecognition'

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard'
import MyAttendance     from '../pages/student/MyAttendance'
import MyCourses        from '../pages/student/MyCourses'
import QRScan           from '../pages/student/QRScan'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (!user)   return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }
  return children
}

export default function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace /> : <RegisterPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="students"   element={<StudentManagement />} />
          <Route path="courses"    element={<CourseManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="qr"         element={<QRAttendance />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="face"       element={<FaceRecognition />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<StudentDashboard />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="courses"    element={<MyCourses />} />
          <Route path="qr-scan"    element={<QRScan />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
