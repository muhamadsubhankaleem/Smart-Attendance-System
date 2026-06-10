import { useEffect, useState } from 'react'
import { BookOpen, Clock, User, Hash } from 'lucide-react'
import { coursesApi, studentsApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MyCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const sid = localStorage.getItem('student_id')
        if (!sid) { setLoading(false); return }
        // Get student's enrolled course IDs
        const allStudents = await studentsApi.getAll()
        const me = allStudents.find(s => s.email === user?.email)
        if (!me) { setLoading(false); return }
        // Save student ID for other pages
        localStorage.setItem('student_id', me.id)
        const allCourses = await coursesApi.getAll()
        const enrolled = allCourses.filter(c => me.enrolled_courses.includes(c.id))
        setCourses(enrolled)
      } catch { toast.error('Failed to load courses') }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <p className="page-subtitle">Enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 glass-card text-slate-600">
          <BookOpen size={40} className="mb-3 opacity-30" />
          <p className="text-sm">You're not enrolled in any courses yet</p>
          <p className="text-xs mt-1">Contact your admin to enroll</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.id} className="glass-card-hover p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded inline-block mb-1">{c.code}</span>
                  <h3 className="text-white font-semibold text-sm leading-tight">{c.name}</h3>
                </div>
              </div>

              {/* Description */}
              {c.description && (
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">{c.description}</p>
              )}

              {/* Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <User size={12} className="text-slate-600 flex-shrink-0" />
                  <span className="truncate">{c.instructor}</span>
                </div>
                {c.schedule && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} className="text-slate-600 flex-shrink-0" />
                    <span>{c.schedule}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500">
                  <Hash size={12} className="text-slate-600 flex-shrink-0" />
                  <span>{c.credit_hours} Credit Hours</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <span className="text-slate-600">{c.total_students} student{c.total_students !== 1 ? 's' : ''} enrolled</span>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
