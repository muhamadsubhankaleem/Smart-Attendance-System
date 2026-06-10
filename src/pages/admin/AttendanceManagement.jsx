import { useEffect, useState } from 'react'
import { ClipboardCheck, Pencil, Trash2, Plus } from 'lucide-react'
import { coursesApi, attendanceApi, studentsApi } from '../../api/api'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

const STATUS_CYCLE = { present: 'absent', absent: 'late', late: 'present' }
const STATUS_COLOR = { present: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', absent: 'bg-rose-500/20 border-rose-500/40 text-rose-300', late: 'bg-amber-500/20 border-amber-500/40 text-amber-300' }

export default function AttendanceManagement() {
  const [courses, setCourses]   = useState([])
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords]   = useState({})   // studentId → status
  const [loading, setLoading]   = useState(false)
  const [sessLoading, setSessLoading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [editRecords, setEditRecords] = useState({})
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    coursesApi.getAll().then(setCourses).catch(() => toast.error('Failed to load courses'))
  }, [])

  useEffect(() => {
    if (!selectedCourse) { setSessions([]); return }
    setSessLoading(true)
    attendanceApi.getSessions({ course_id: selectedCourse })
      .then(setSessions).catch(() => {}).finally(() => setSessLoading(false))
  }, [selectedCourse])

  const loadStudents = async () => {
    if (!selectedCourse) { toast.error('Select a course first'); return }
    setLoading(true)
    try {
      const course = courses.find(c => c.id === selectedCourse)
      if (!course?.enrolled_students?.length) { setStudents([]); toast('No enrolled students in this course'); setLoading(false); return }
      const all = await studentsApi.getAll()
      const enrolled = all.filter(s => course.enrolled_students.includes(s.id))
      setStudents(enrolled)
      const init = {}
      enrolled.forEach(s => { init[s.id] = 'present' })
      setRecords(init)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  const cycleStatus = (studentId) => setRecords(r => ({ ...r, [studentId]: STATUS_CYCLE[r[studentId]] || 'present' }))
  const setAll = (status) => setRecords(r => { const n = {}; Object.keys(r).forEach(id => n[id] = status); return n })

  const handleCreateSession = async () => {
    if (!selectedCourse || !selectedDate || Object.keys(records).length === 0) { toast.error('Select course, date and load students first'); return }
    setSaving(true)
    try {
      const data = { course_id: selectedCourse, date: selectedDate, records: Object.entries(records).map(([student_id, status]) => ({ student_id, status })) }
      await attendanceApi.createSession(data)
      toast.success('Attendance session created!')
      const s = await attendanceApi.getSessions({ course_id: selectedCourse })
      setSessions(s); setStudents([]); setRecords({})
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create session') }
    finally { setSaving(false) }
  }

  const openEdit = (session) => {
    const rmap = {}
    session.records.forEach(r => { rmap[r.student_id] = r.status })
    setEditRecords(rmap); setEditModal(session)
  }

  const handleUpdateSession = async () => {
    setSaving(true)
    try {
      await attendanceApi.updateSession(editModal.id, {
        records: Object.entries(editRecords).map(([student_id, status]) => ({ student_id, status }))
      })
      toast.success('Session updated')
      const s = await attendanceApi.getSessions({ course_id: selectedCourse })
      setSessions(s); setEditModal(null)
    } catch (err) { toast.error(err.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await attendanceApi.deleteSession(confirmDel.id)
      toast.success('Session deleted')
      const s = await attendanceApi.getSessions({ course_id: selectedCourse })
      setSessions(s); setConfirmDel(null)
    } catch (err) { toast.error(err.response?.data?.detail || 'Delete failed') }
    finally { setDeleting(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance Management</h1>
        <p className="page-subtitle">Mark, view, and edit attendance sessions</p>
      </div>

      {/* Mark Attendance Panel */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Plus size={16} className="text-indigo-400" /> New Attendance Session
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="select-field flex-1 min-w-48" value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setStudents([]); setRecords({}) }}>
            <option value="">Select course…</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
          <input type="date" className="input-field w-44" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button onClick={loadStudents} className="btn-secondary" disabled={!selectedCourse || loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Load Students'}
          </button>
        </div>

        {students.length > 0 && (
          <>
            {/* Bulk actions */}
            <div className="flex gap-2 mb-3">
              <span className="text-slate-500 text-xs my-auto mr-1">Mark all:</span>
              {['present', 'absent', 'late'].map(s => (
                <button key={s} onClick={() => setAll(s)} className={`text-xs px-3 py-1 rounded-lg border transition-colors capitalize ${STATUS_COLOR[s]}`}>{s}</button>
              ))}
            </div>

            {/* Student list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {students.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${STATUS_COLOR[records[s.id] || 'present']}`}
                  onClick={() => cycleStatus(s.id)}>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs opacity-70">{s.roll_number}</p>
                  </div>
                  <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-black/20">
                    {records[s.id] || 'present'}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={handleCreateSession} disabled={saving} className="btn-primary">
              {saving ? <LoadingSpinner size="sm" /> : <><ClipboardCheck size={16} /> Save Session</>}
            </button>
          </>
        )}
      </div>

      {/* Sessions Table */}
      {selectedCourse && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-semibold text-sm">Session History</h2>
          </div>
          {sessLoading ? (
            <div className="flex items-center justify-center h-32"><LoadingSpinner /></div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No sessions for this course yet</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Course</th><th>Present</th><th>Absent</th><th>Late</th><th>Notes</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono text-indigo-300 text-xs">{s.date}</td>
                      <td className="text-slate-400 text-xs">{s.course_code}</td>
                      <td><span className="badge-present badge">{s.total_present}</span></td>
                      <td><span className="badge-absent badge">{s.total_absent}</span></td>
                      <td><span className="badge-late badge">{s.total_late}</span></td>
                      <td className="text-slate-600 text-xs max-w-32 truncate">{s.notes || '—'}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(s)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                          <button onClick={() => setConfirmDel(s)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Session Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={`Edit Session — ${editModal?.date}`} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 max-h-80 overflow-y-auto pr-1">
          {editModal?.records.map(rec => (
            <div key={rec.student_id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${STATUS_COLOR[editRecords[rec.student_id] || rec.status]}`}
              onClick={() => setEditRecords(r => ({ ...r, [rec.student_id]: STATUS_CYCLE[r[rec.student_id]] || 'present' }))}>
              <div>
                <p className="text-sm font-medium">{rec.student_name}</p>
                <p className="text-xs opacity-70">{rec.roll_number}</p>
              </div>
              <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-black/20">
                {editRecords[rec.student_id] || rec.status}
              </span>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-xs mb-4">Click a student card to cycle: present → absent → late</p>
        <div className="flex gap-3">
          <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleUpdateSession} disabled={saving} className="btn-primary flex-1">
            {saving ? <LoadingSpinner size="sm" /> : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Session" loading={deleting}
        message={`Delete the session for "${confirmDel?.date}"? This cannot be undone.`}
      />
    </div>
  )
}
