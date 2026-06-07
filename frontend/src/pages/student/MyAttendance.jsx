import { useEffect, useState } from 'react'
import { ClipboardList, Filter } from 'lucide-react'
import { attendanceApi, coursesApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MyAttendance() {
  const { user } = useAuth()
  const [records, setRecords]   = useState([])
  const [courses, setCourses]   = useState([])
  const [filter, setFilter]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [studentId, setStudentId] = useState(null)

  useEffect(() => {
    const sid = localStorage.getItem('student_id')
    if (!sid) { setLoading(false); return }
    setStudentId(sid)
    Promise.all([
      attendanceApi.getStudentAttendance(sid),
      coursesApi.getAll(),
    ]).then(([att, crs]) => { setRecords(att); setCourses(crs) })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter ? records.filter(r => r.course_id === filter) : records

  // Per-course stats
  const courseStats = {}
  records.forEach(r => {
    if (!courseStats[r.course_id]) courseStats[r.course_id] = { name: r.course_name, code: r.course_code, present: 0, absent: 0, late: 0, total: 0 }
    courseStats[r.course_id][r.status]++
    courseStats[r.course_id].total++
  })

  const STATUS_ICON = { present: '✅', absent: '❌', late: '🕐' }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  if (!studentId) return (
    <div className="animate-fade-in glass-card p-8 text-center max-w-md mx-auto mt-8">
      <ClipboardList size={40} className="mx-auto mb-3 text-indigo-400 opacity-50" />
      <h3 className="text-white font-semibold mb-2">Profile Not Linked</h3>
      <p className="text-slate-400 text-sm">Contact your admin to link your student profile.</p>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">{records.length} total records across {Object.keys(courseStats).length} courses</p>
      </div>

      {/* Course summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {Object.entries(courseStats).map(([cid, stat]) => {
          const pct = Math.round((stat.present + stat.late) / stat.total * 100)
          return (
            <div key={cid} className="glass-card p-4 cursor-pointer hover:border-white/20 transition-all"
              onClick={() => setFilter(f => f === cid ? '' : cid)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold text-sm">{stat.name}</p>
                  <p className="text-slate-600 text-xs">{stat.code}</p>
                </div>
                <span className={`text-lg font-extrabold ${pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full mb-3">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171', transition: 'width 0.7s ease' }} />
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>✅ {stat.present}</span>
                <span>❌ {stat.absent}</span>
                <span>🕐 {stat.late}</span>
                <span className="ml-auto">{stat.total} sessions</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-600" />
          <select className="select-field" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Courses</option>
            {Object.entries(courseStats).map(([cid, stat]) => (
              <option key={cid} value={cid}>{stat.code} — {stat.name}</option>
            ))}
          </select>
        </div>
        {filter && <button onClick={() => setFilter('')} className="btn-secondary btn-sm text-xs">Clear Filter</button>}
      </div>

      {/* Attendance table */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <ClipboardList size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No attendance records found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs text-slate-400">{r.date}</td>
                    <td className="text-white text-xs font-medium">{r.course_name}</td>
                    <td>
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                        {r.course_code}
                      </span>
                    </td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
