import { useEffect, useState, useRef } from 'react'
import { QrCode, RefreshCw, Clock, Users, CheckCircle } from 'lucide-react'
import { coursesApi, qrApi } from '../../api/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function QRAttendance() {
  const [courses, setCourses]   = useState([])
  const [course, setCourse]     = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [qrData, setQrData]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef                = useRef(null)

  useEffect(() => {
    coursesApi.getAll().then(setCourses).catch(() => toast.error('Failed to load courses'))
    return () => clearInterval(timerRef.current)
  }, [])

  const startCountdown = (expiresAt) => {
    clearInterval(timerRef.current)
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
      setTimeLeft(diff)
      if (diff === 0) clearInterval(timerRef.current)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  const generateQR = async () => {
    if (!course) { toast.error('Select a course'); return }
    setLoading(true)
    try {
      const data = await qrApi.generate({ course_id: course, session_date: date })
      setQrData(data)
      startCountdown(data.expires_at)
      toast.success('QR code generated! Valid for 5 minutes.')
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate QR') }
    finally { setLoading(false) }
  }

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const isExpired = timeLeft === 0 && qrData
  const urgency = timeLeft < 60 ? 'text-rose-400' : timeLeft < 120 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">QR Code Attendance</h1>
        <p className="page-subtitle">Generate a QR code for students to scan and mark attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Generate QR Session</h2>
            <div className="space-y-3">
              <div>
                <label className="input-label">Course</label>
                <select className="select-field" value={course} onChange={e => setCourse(e.target.value)}>
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Session Date</label>
                <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <button onClick={generateQR} disabled={loading || !course} className="btn-primary w-full">
                {loading ? <LoadingSpinner size="sm" /> : <><QrCode size={16} /> Generate QR Code</>}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card p-5">
            <h2 className="text-white font-semibold text-sm mb-3">How It Works</h2>
            <div className="space-y-3">
              {[
                { n: 1, text: 'Select a course and session date above' },
                { n: 2, text: 'Click "Generate QR Code" — valid for 5 minutes' },
                { n: 3, text: 'Display QR on projector or screen for students' },
                { n: 4, text: 'Students scan with their camera in Student Portal → QR Scan' },
                { n: 5, text: 'Attendance auto-marks as present, duplicates prevented' },
              ].map(({ n, text }) => (
                <div key={n} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{n}</span>
                  <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Display */}
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-80">
          {!qrData ? (
            <div className="text-center text-slate-600">
              <QrCode size={48} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm">QR code will appear here</p>
              <p className="text-xs mt-1">Select a course and click Generate</p>
            </div>
          ) : (
            <div className="text-center w-full">
              {/* Timer */}
              <div className={`flex items-center justify-center gap-2 mb-4 ${isExpired ? 'text-rose-400' : urgency}`}>
                <Clock size={16} />
                <span className="font-mono font-bold text-lg">
                  {isExpired ? 'EXPIRED' : fmt(timeLeft)}
                </span>
              </div>

              {/* QR Image */}
              <div className={`relative inline-block p-3 rounded-2xl bg-white shadow-2xl mb-4 ${isExpired ? 'opacity-40 grayscale' : ''}`}>
                <img src={qrData.qr_image_base64} alt="QR Code" className="w-56 h-56 object-contain" />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                    <span className="text-white font-bold text-sm bg-rose-600/90 px-3 py-1 rounded-full">EXPIRED</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-1 mb-4">
                <p className="text-white font-semibold text-sm">{qrData.course_name}</p>
                <p className="text-slate-500 text-xs">{qrData.session_date}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle size={14} />
                  <span className="text-sm font-semibold">{qrData.scanned_students?.length || 0}</span>
                  <span className="text-xs text-slate-600">scanned</span>
                </div>
              </div>

              {!isExpired && (
                <button onClick={generateQR} disabled={loading} className="btn-secondary btn-sm mx-auto">
                  <RefreshCw size={13} /> Regenerate
                </button>
              )}
              {isExpired && (
                <button onClick={generateQR} disabled={loading} className="btn-primary">
                  <QrCode size={14} /> Generate New QR
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
