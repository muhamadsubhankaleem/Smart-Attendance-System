import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, BookOpen, Shield, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' })
  const [showPwd, setShowPwd]     = useState(false)
  const [showCPwd, setShowCPwd]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const { setAuth }               = useAuth()
  const navigate                  = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const data = await authApi.register({ name: form.name, email: form.email, password: form.password, role: form.role })
      setAuth(data)
      toast.success(`Account created! Welcome, ${data.user.name}! 🎉`)
      navigate(form.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwdMatch = form.confirmPassword && form.password !== form.confirmPassword

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <BookOpen size={22} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-white font-extrabold text-lg leading-tight">SmartAttend</p>
            <p className="text-indigo-400 text-xs">Attendance Management System</p>
          </div>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-0.5">Create account</h3>
          <p className="text-slate-500 text-sm mb-6">Join the Smart Attendance System</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { v: 'admin',   label: 'Admin',   icon: Shield,        desc: 'Manage everything' },
              { v: 'student', label: 'Student', icon: GraduationCap, desc: 'Track attendance' },
            ].map(({ v, label, icon: Icon, desc }) => (
              <button
                key={v} type="button" onClick={() => setForm(f => ({ ...f, role: v }))}
                className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                  form.role === v ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20'
                }`}
              >
                {form.role === v && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-400" />}
                <Icon size={18} className={form.role === v ? 'text-indigo-400' : 'text-slate-600'} />
                <p className={`text-sm font-semibold mt-2 ${form.role === v ? 'text-white' : 'text-slate-500'}`}>{label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={form.name} onChange={set('name')} required placeholder="John Doe" className="input-field pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" className="input-field pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type={showCPwd ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                  required placeholder="Re-enter password"
                  className={`input-field pl-10 pr-10 ${pwdMatch ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30' : ''}`}
                />
                <button type="button" onClick={() => setShowCPwd(!showCPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  {showCPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdMatch && <p className="text-rose-400 text-xs mt-1">Passwords don't match</p>}
            </div>

            <button type="submit" disabled={loading || pwdMatch} className="btn-primary w-full py-3 mt-1">
              {loading ? <><LoadingSpinner size="sm" /> Creating account...</> : `Create ${form.role === 'admin' ? 'Admin' : 'Student'} Account`}
            </button>
          </form>

          <p className="text-center text-slate-600 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
