import { useEffect, useState } from 'react'
import { Users, BookOpen, ClipboardCheck, TrendingUp, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { reportsApi } from '../../api/api'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi.overview().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  )

  const sc = stats?.status_counts || {}

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, <span className="text-white font-medium">{user?.name}</span> — here's your overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}          label="Total Students" value={stats?.total_students ?? 0}
          sub="Registered students" iconBg="bg-indigo-500/15 border border-indigo-500/20" />
        <StatCard icon={BookOpen}       label="Total Courses"  value={stats?.total_courses ?? 0}
          sub="Active courses"     iconBg="bg-violet-500/15 border border-violet-500/20" />
        <StatCard icon={ClipboardCheck} label="Total Sessions" value={stats?.total_sessions ?? 0}
          sub="Attendance sessions" iconBg="bg-cyan-500/15 border border-cyan-500/20" />
        <StatCard icon={TrendingUp}     label="Attendance Rate" value={`${stats?.attendance_rate ?? 0}%`}
          sub="Overall rate" iconBg="bg-emerald-500/15 border border-emerald-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Attendance breakdown */}
        <div className="glass-card p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Attendance Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Present', value: sc.present || 0, icon: CheckCircle, color: 'text-emerald-400', bar: 'bg-emerald-500' },
              { label: 'Absent',  value: sc.absent  || 0, icon: XCircle,     color: 'text-rose-400',    bar: 'bg-rose-500' },
              { label: 'Late',    value: sc.late    || 0, icon: Clock,        color: 'text-amber-400',   bar: 'bg-amber-500' },
            ].map(({ label, value, icon: Icon, color, bar }) => {
              const total = (sc.present || 0) + (sc.absent || 0) + (sc.late || 0)
              const pct = total > 0 ? Math.round(value / total * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={color} />
                      <span className="text-slate-400 text-xs">{label}</span>
                    </div>
                    <span className="text-white text-xs font-semibold">{value} <span className="text-slate-600">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Recent Sessions</h2>
            <span className="text-slate-600 text-xs">Last 5</span>
          </div>
          {stats?.recent_sessions?.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_sessions.map((s) => (
                <div key={s.session_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{s.course_name}</p>
                    <p className="text-slate-600 text-[11px]">{s.course_code} · {s.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-300 text-xs font-semibold">{s.total_records}</p>
                    <p className="text-slate-600 text-[11px]">students</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No sessions yet</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-card p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/students',   icon: Users,          label: 'Add Student',    color: 'indigo' },
            { to: '/admin/courses',    icon: BookOpen,        label: 'Create Course',  color: 'violet' },
            { to: '/admin/attendance', icon: ClipboardCheck,  label: 'Mark Attendance', color: 'cyan' },
            { to: '/admin/qr',         icon: ClipboardCheck,  label: 'Generate QR',   color: 'emerald' },
          ].map(({ to, icon: Icon, label, color }) => (
            <a key={to} href={to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/15 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <span className="text-slate-400 text-xs text-center group-hover:text-slate-200 transition-colors">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
