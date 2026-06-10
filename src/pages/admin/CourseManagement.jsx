import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Users, RefreshCw, UserPlus } from 'lucide-react'
import { coursesApi, studentsApi } from '../../api/api'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const EMPTY = { code: '', name: '', description: '', instructor: '', schedule: '', credit_hours: 3 }

export default function CourseManagement() {
  const [courses, setCourses]     = useState([])
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [assignSelected, setAssignSelected] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([coursesApi.getAll(), studentsApi.getAll()])
      setCourses(c); setStudents(s)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd   = () => { setForm(EMPTY); setModal('add') }
  const openEdit  = (c) => { setSelected(c); setForm({ code: c.code, name: c.name, description: c.description, instructor: c.instructor, schedule: c.schedule, credit_hours: c.credit_hours }); setModal('edit') }
  const openAssign = (c) => { setSelected(c); setAssignSelected(c.enrolled_students || []); setAssignSearch(''); setModal('assign') }
  const closeModal = () => { setModal(null); setSelected(null) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal === 'add') { await coursesApi.create({ ...form, credit_hours: Number(form.credit_hours) }); toast.success('Course created') }
      else { await coursesApi.update(selected.id, { ...form, credit_hours: Number(form.credit_hours) }); toast.success('Course updated') }
      closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await coursesApi.delete(confirmDel.id); toast.success('Course deleted'); setConfirmDel(null); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Delete failed') }
    finally { setDeleting(false) }
  }

  const handleAssign = async () => {
    setSaving(true)
    try {
      await coursesApi.enroll(selected.id, { student_ids: assignSelected })
      toast.success(`${assignSelected.length} student(s) enrolled`); closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Enroll failed') }
    finally { setSaving(false) }
  }

  const toggleAssign = (id) => setAssignSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(assignSearch.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Course Management</h1>
          <p className="page-subtitle">Create, update, and assign students to courses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw size={15} /></button>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Course</button>
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-600 glass-card">
          <BookOpen size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No courses yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.id} className="glass-card p-5 flex flex-col gap-3 hover:border-white/[0.15] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded mb-1 inline-block">{c.code}</span>
                  <h3 className="text-white font-semibold text-sm mt-1">{c.name}</h3>
                </div>
                <span className="text-slate-600 text-xs bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">{c.credit_hours} cr</span>
              </div>

              {c.description && <p className="text-slate-600 text-xs line-clamp-2">{c.description}</p>}

              <div className="space-y-1">
                <div className="flex gap-2 text-xs text-slate-500"><span className="text-slate-600">Instructor:</span> {c.instructor}</div>
                {c.schedule && <div className="flex gap-2 text-xs text-slate-500"><span className="text-slate-600">Schedule:</span> {c.schedule}</div>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={13} className="text-indigo-400" />
                  <span>{c.total_students} student{c.total_students !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openAssign(c)} className="btn-secondary btn-sm" title="Assign Students">
                    <UserPlus size={12} />
                  </button>
                  <button onClick={() => openEdit(c)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                  <button onClick={() => setConfirmDel(c)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={closeModal}
        title={modal === 'add' ? 'Create Course' : 'Edit Course'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Course Code</label>
              <input className="input-field" value={form.code} onChange={set('code')} required placeholder="CS-101" disabled={modal === 'edit'} />
            </div>
            <div>
              <label className="input-label">Credit Hours</label>
              <select className="select-field" value={form.credit_hours} onChange={set('credit_hours')}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Course Name</label>
            <input className="input-field" value={form.name} onChange={set('name')} required placeholder="Data Structures and Algorithms" />
          </div>
          <div>
            <label className="input-label">Instructor</label>
            <input className="input-field" value={form.instructor} onChange={set('instructor')} required placeholder="Dr. Smith" />
          </div>
          <div>
            <label className="input-label">Schedule (optional)</label>
            <input className="input-field" value={form.schedule} onChange={set('schedule')} placeholder="Mon/Wed 10:00–11:30 AM" />
          </div>
          <div>
            <label className="input-label">Description (optional)</label>
            <textarea className="input-field resize-none" rows={2} value={form.description} onChange={set('description')} placeholder="Brief course description…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : modal === 'add' ? 'Create Course' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Students Modal */}
      <Modal isOpen={modal === 'assign'} onClose={closeModal} title={`Assign Students — ${selected?.name}`} size="lg">
        <div className="mb-3">
          <input className="input-field" value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
            placeholder="Search students…" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
          {filteredStudents.map(s => {
            const checked = assignSelected.includes(s.id)
            return (
              <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${checked ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06]'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleAssign(s.id)} className="accent-indigo-500" />
                <div>
                  <p className="text-white text-sm font-medium">{s.name}</p>
                  <p className="text-slate-600 text-xs">{s.roll_number} · {s.department}</p>
                </div>
              </label>
            )
          })}
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 text-xs">{assignSelected.length} student(s) selected</span>
        </div>
        <div className="flex gap-3">
          <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAssign} disabled={saving || assignSelected.length === 0} className="btn-primary flex-1">
            {saving ? <LoadingSpinner size="sm" /> : `Enroll ${assignSelected.length} Student(s)`}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Course" loading={deleting}
        message={`Delete "${confirmDel?.name}"? All attendance data for this course will also be removed.`}
      />
    </div>
  )
}
