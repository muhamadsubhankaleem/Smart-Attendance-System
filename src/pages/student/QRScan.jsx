import { useState } from 'react'
import { QrCode, CheckCircle, XCircle, Loader } from 'lucide-react'
import { qrApi } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function QRScan() {
  const { user } = useAuth()
  const [token, setToken]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  const handleMark = async (e) => {
    e.preventDefault()
    if (!token.trim()) { toast.error('Enter the QR token'); return }
    setLoading(true); setResult(null)
    try {
      const data = await qrApi.mark({ qr_token: token.trim() })
      setResult({ type: 'success', ...data })
      setToken('')
      toast.success(data.message)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to mark attendance'
      setResult({ type: 'error', message: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">QR Code Attendance</h1>
        <p className="page-subtitle">Scan the QR code or enter the token to mark your attendance</p>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        {/* Scan card */}
        <div className="glass-card p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-3">
              <QrCode size={32} className="text-indigo-400" />
            </div>
            <h2 className="text-white font-semibold">Mark Attendance via QR</h2>
            <p className="text-slate-500 text-sm mt-1">Enter the QR token displayed by your instructor</p>
          </div>

          <form onSubmit={handleMark} className="space-y-4">
            <div>
              <label className="input-label">QR Token</label>
              <textarea
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste the QR token here…"
                rows={4}
                className="input-field resize-none font-mono text-xs leading-relaxed"
              />
              <p className="text-slate-600 text-xs mt-1">The token is a long string starting with "eyJ…"</p>
            </div>

            <button type="submit" disabled={loading || !token.trim()} className="btn-primary w-full py-3">
              {loading ? <><LoadingSpinner size="sm" /> Marking attendance…</> : <><QrCode size={16} /> Mark Attendance</>}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className={`glass-card p-5 border ${result.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'} animate-scale-in`}>
            <div className="flex items-start gap-4">
              {result.type === 'success'
                ? <CheckCircle size={28} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                : <XCircle size={28} className="text-rose-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className={`font-semibold ${result.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.type === 'success' ? 'Attendance Marked!' : 'Failed'}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">{result.message}</p>
                {result.type === 'success' && (
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>📚 <span className="text-slate-300">{result.course_name}</span></p>
                    <p>📅 <span className="text-slate-300">{result.date}</span></p>
                    <p>✅ Status: <span className="text-emerald-400 font-semibold capitalize">{result.status}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-3">How to mark attendance</h3>
          <div className="space-y-2.5">
            {[
              'Your instructor generates a QR code at the start of class',
              'The QR code is displayed on the projector for 5 minutes',
              'Copy the QR token from the code (ask your instructor) and paste it above',
              'Click "Mark Attendance" — you\'re done!',
              'Each QR can only be used once per session',
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                <p className="text-slate-400 text-xs leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
