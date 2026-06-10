import { useEffect, useState } from 'react'
import { TrendingUp, BookOpen, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { attendanceApi, coursesApi, reportsApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [report, setReport]     = useState(null)
  const [courses, setCourses]   = useState([])
  const [recent, setRecent]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [studentId, setStudentId] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Find the student record linked to this user's email
        const allCourses = await coursesApi.getAll()
        setCourses(allCourses)

        // Try to load student report using stored student info
        const stored = localStorage.getItem('student_id')
        if (stored) {
          setStudentId(stored)
          const r = await reportsApi.studentReport(stored)
          setReport(r)
          const att = await attendanceApi.getStudentAttendance(stored)
          setRecent(att.slice(0, 8))
        }
      } catch (err) {
        // Student ID may not be set — show partial info
        console.warn('Could not load student report:', err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  )

  const overallPct = report?.overall_percentage ?? 0
  const pctColor = overallPct >= 75 ? 'text-emerald-400' : overallPct >= 60 ? 'text-amber-400' : 'text-rose-400'
  const ringColor = overallPct >= 75 ? '#34d399' : overallPct >= 60 ? '#fbbf24' : '#f87171'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Welcome back, <span className="text-white font-medium">{user?.name}</span></p>
      </div>

      {!report ? (
        /* No student profile linked */
        <div className="glass-card p-8 text-center max-w-lg mx-auto">
          <TrendingUp size={40} className="mx-auto mb-3 text-indigo-400 opacity-60" />
          <h3 className="text-white font-semibold mb-2">Profile Not Linked</h3>
          <p className="text-slate-400 text-sm mb-4">
            Your account isn't linked to a student profile yet. Contact your admin to add your student record using the same email address.
          </p>
          <p className="text-slate-600 text-xs font-mono bg-white/[0.04] border border-white/10 px-3 py-2 rounded-lg inline-block">{user?.email}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Attendance ring */}
            <div className="glass-card p-6 flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={ringColor} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallPct / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-extrabold ${pctColor}`}>{overallPct}%</span>
                  <span className="text-slate-600 text-[10px]">overall</span>
                </div>
              </div>
              <p className="text-white font-semibold text-sm">Attendance Rate</p>
              <p className="text-slate-600 text-xs">{report.student_name} · {report.roll_number}</p>
            </div>

            {/* Course cards summary */}
            <div className="glass-card p-5 sm:col-span-2">
              <h2 className="text-white font-semibold text-sm mb-3">Per-Course Attendance</h2>
              <div className="space-y-2.5">
                {report.course_stats.map(c => (
                  <div key={c.course_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-xs truncate flex-1 mr-3">{c.course_name}</span>
                      <span className={`text-xs font-bold flex-shrink-0 ${c.percentage >= 75 ? 'text-emerald-400' : c.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{c.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${c.percentage}%`, background: c.percentage >= 75 ? '#34d399' : c.percentage >= 60 ? '#fbbf24' : '#f87171' }} />
                    </div>
                  </div>
                ))}
                {report.course_stats.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-4">No attendance records yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent attendance */}
          {recent.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-400" /> Recent Attendance
                </h2>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs text-slate-400">{r.date}</td>
                        <td>
                          <p className="text-white text-xs font-medium">{r.course_name}</p>
                          <p className="text-slate-600 text-[11px]">{r.course_code}</p>
                        </td>
                        <td><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
