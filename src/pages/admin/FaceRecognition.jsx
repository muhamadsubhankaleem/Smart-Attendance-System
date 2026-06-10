import { useEffect, useRef, useState } from 'react'
import { Camera, UserCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { studentsApi, coursesApi, faceApi } from '../../api/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FaceRecognition() {
  const [mode, setMode]         = useState('register') // 'register' | 'recognize'
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [selStudent, setSelStudent] = useState('')
  const [selCourse, setSelCourse]   = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [available, setAvailable] = useState(null)
  const [stream, setStream]     = useState(null)
  const [captured, setCaptured] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    faceApi.status().then(r => setAvailable(r.available)).catch(() => setAvailable(false))
    Promise.all([studentsApi.getAll(), coursesApi.getAll()])
      .then(([s, c]) => { setStudents(s); setCourses(c) })
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setStream(s)
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play() }
    } catch { toast.error('Camera access denied') }
  }

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const b64 = canvasRef.current.toDataURL('image/jpeg', 0.85)
    setCaptured(b64); stopCamera()
  }

  const handleRegister = async () => {
    if (!selStudent || !captured) { toast.error('Select student and capture photo'); return }
    setLoading(true)
    try {
      const r = await faceApi.register({ student_id: selStudent, image_base64: captured })
      toast.success(r.message); setResult({ type: 'success', message: r.message }); setCaptured(null)
    } catch (err) { toast.error(err.response?.data?.detail || 'Registration failed'); setResult({ type: 'error', message: err.response?.data?.detail }) }
    finally { setLoading(false) }
  }

  const handleRecognize = async () => {
    if (!selCourse || !captured) { toast.error('Select course and capture photo'); return }
    setLoading(true)
    try {
      const r = await faceApi.recognize({ image_base64: captured, course_id: selCourse, session_date: date })
      toast.success(r.message); setResult({ type: 'success', ...r }); setCaptured(null)
    } catch (err) { toast.error(err.response?.data?.detail || 'Recognition failed'); setResult({ type: 'error', message: err.response?.data?.detail }) }
    finally { setLoading(false) }
  }

  const reset = () => { setCaptured(null); setResult(null); stopCamera() }

  if (available === false) return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Face Recognition</h1>
        <p className="page-subtitle">Auto-mark attendance using facial recognition</p>
      </div>
      <div className="glass-card p-8 flex flex-col items-center text-center max-w-lg mx-auto">
        <AlertCircle size={48} className="text-amber-400 mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Module Not Installed</h3>
        <p className="text-slate-400 text-sm mb-4">The face recognition library is not installed on the server.</p>
        <code className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-indigo-300 text-xs font-mono">
          pip install face-recognition opencv-python
        </code>
        <p className="text-slate-600 text-xs mt-3">Windows also requires cmake and Visual C++ Build Tools</p>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Face Recognition</h1>
        <p className="page-subtitle">Register faces and auto-mark attendance via webcam</p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 w-fit mb-6">
        {[{ v: 'register', label: '📷 Register Face' }, { v: 'recognize', label: '🔍 Recognize & Mark' }].map(({ v, label }) => (
          <button key={v} onClick={() => { setMode(v); reset() }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === v ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">
            {mode === 'register' ? 'Register Student Face' : 'Auto-Mark Attendance'}
          </h2>

          {mode === 'register' ? (
            <div>
              <label className="input-label">Select Student</label>
              <select className="select-field" value={selStudent} onChange={e => setSelStudent(e.target.value)}>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.roll_number} — {s.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="input-label">Course</label>
                <select className="select-field" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Session Date</label>
                <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {!stream && !captured && (
              <button onClick={startCamera} className="btn-secondary w-full">
                <Camera size={15} /> Open Camera
              </button>
            )}
            {stream && (
              <button onClick={capturePhoto} className="btn-primary w-full">
                <Camera size={15} /> Capture Photo
              </button>
            )}
            {captured && (
              <>
                <button onClick={mode === 'register' ? handleRegister : handleRecognize}
                  disabled={loading || (mode === 'register' ? !selStudent : !selCourse)}
                  className="btn-primary w-full">
                  {loading ? <LoadingSpinner size="sm" /> : <><UserCheck size={15} /> {mode === 'register' ? 'Register Face' : 'Recognize & Mark'}</>}
                </button>
                <button onClick={reset} className="btn-secondary w-full">Retake Photo</button>
              </>
            )}
          </div>

          {/* Result card */}
          {result && (
            <div className={`p-4 rounded-xl border ${result.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <div className="flex items-start gap-3">
                {result.type === 'success' ? <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={20} className="text-rose-400 flex-shrink-0" />}
                <div>
                  <p className={`text-sm font-medium ${result.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{result.message}</p>
                  {result.confidence && <p className="text-slate-500 text-xs mt-0.5">Confidence: {result.confidence}%</p>}
                  {result.student_name && result.type === 'success' && <p className="text-slate-400 text-xs mt-0.5">{result.student_name} · {result.course_name}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera/Preview */}
        <div className="glass-card p-5 flex flex-col items-center justify-center min-h-72">
          {stream && <video ref={videoRef} className="w-full rounded-xl max-h-64 object-cover" autoPlay playsInline muted />}
          {captured && <img src={captured} alt="Captured" className="w-full rounded-xl max-h-64 object-cover" />}
          {!stream && !captured && (
            <div className="text-center text-slate-600">
              <Camera size={48} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm">Camera preview will appear here</p>
              <p className="text-xs mt-1">Click "Open Camera" to start</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  )
}
