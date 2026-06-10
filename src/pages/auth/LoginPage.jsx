import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, BookOpen, Users, BarChart3, QrCode, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const FEATURES = [
  { icon: Users,       text: 'Manage students & courses' },
  { icon: BarChart3,   text: 'Real-time attendance analytics' },
  { icon: QrCode,      text: 'QR code attendance marking' },
  { icon: ShieldCheck, text: 'Secure role-based access' },
]

export default function LoginPage() {
  const [role, setRole]               = useState('admin')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const { setAuth }                   = useAuth()
  const navigate                      = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      if (data.user.role !== role) {
        toast.error(`This account is a ${data.user.role} account, not ${role}`)
        return
      }
      setAuth(data)
      toast.success(`Welcome back, ${data.user.name}! 👋`)
      navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[58%] relative items-center justify-center overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-dark-900 to-violet-900/40" />
        {/* floating orbs */}
        <div className="absolute top-24 left-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-24 right-12 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        {/* grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-md px-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xl tracking-tight">SmartAttend</h1>
              <p className="text-indigo-400 text-xs">Attendance Management System</p>
            </div>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-tight mb-4">
            Attendance<br />Made <span className="text-gradient">Smart.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10">
            Track, manage, and analyse student attendance in real time — with QR codes, face recognition, and detailed reports.
          </p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-[42%] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-white font-bold">SmartAttend</span>
          </div>

          <div className="glass-card p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-0.5">Welcome back</h3>
            <p className="text-slate-500 text-sm mb-7">Sign in to your account</p>

            {/* Role toggle */}
            <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6 border border-white/[0.07]">
              {['admin', 'student'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                    role === r
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
                {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`}
              </button>
            </form>

            <p className="text-center text-slate-600 text-sm mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
