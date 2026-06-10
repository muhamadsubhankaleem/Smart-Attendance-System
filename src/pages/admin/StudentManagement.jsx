import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, Users, RefreshCw } from 'lucide-react'
import { studentsApi, coursesApi } from '../../api/api'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

const EMPTY = { roll_number: '', name: '', email: '', department: '', semester: 1, phone: '' }
const DEPTS = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Mathematics', 'Physics', 'Chemistry']

export default function StudentManagement() {
  const [students, setStudents]   = useState([])
  const [courses, setCourses]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(null)   // 'add' | 'edit' | 'enroll'
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [enrollIds, setEnrollIds] = useState([])
  const [enrollCourse, setEnrollCourse] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([studentsApi.getAll({ search }), coursesApi.getAll()])
      setStudents(s); setCourses(c)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (s) => { setSelected(s); setForm({ roll_number: s.roll_number, name: s.name, email: s.email, department: s.department, semester: s.semester, phone: s.phone || '' }); setModal('edit') }
  const openEnroll = (s) => { setSelected(s); setEnrollIds(s.enrolled_courses || []); setEnrollCourse(''); setModal('enroll') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal === 'add') {
        await studentsApi.create({ ...form, semester: Number(form.semester) })
        toast.success('Student added successfully')
      } else {
        await studentsApi.update(selected.id, { ...form, semester: Number(form.semester) })
        toast.success('Student updated')
      }
      closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await studentsApi.delete(confirmDel.id); toast.success('Student deleted'); setConfirmDel(null); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Delete failed') }
    finally { setDeleting(false) }
  }

  const handleEnroll = async () => {
    if (!enrollCourse) return
    setSaving(true)
    try {
      await coursesApi.enroll(enrollCourse, { student_ids: [selected.id] })
      toast.success('Student enrolled'); closeModal(); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Enroll failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">Add, edit, and manage student records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll number or email…"
            className="input-field pl-10"
          />
        </div>
        <button onClick={load} className="btn-secondary px-3"><RefreshCw size={15} /></button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <Users size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No students found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No.</th><th>Name</th><th>Email</th>
                  <th>Department</th><th>Sem</th><th>Courses</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-indigo-400 text-xs bg-indigo-500/10 px-2 py-0.5 rounded">{s.roll_number}</span></td>
                    <td><span className="text-white font-medium">{s.name}</span></td>
                    <td className="text-slate-500 text-xs">{s.email}</td>
                    <td className="text-slate-400 text-xs">{s.department}</td>
                    <td><span className="text-slate-300 text-xs">{s.semester}</span></td>
                    <td>
                      <span className="text-xs bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded text-slate-400">
                        {s.enrolled_courses?.length || 0} courses
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEnroll(s)} className="btn-secondary btn-sm" title="Enroll in Course">
                          <Plus size={12} /> Enroll
                        </button>
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

      {/* Add / Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={closeModal}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Roll Number</label>
              <input className="input-field" value={form.roll_number} onChange={set('roll_number')} required placeholder="CS-001" disabled={modal === 'edit'} />
            </div>
            <div>
              <label className="input-label">Semester</label>
              <select className="select-field" value={form.semester} onChange={set('semester')} required>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Full Name</label>
            <input className="input-field" value={form.name} onChange={set('name')} required placeholder="Alice Smith" />
          </div>
          <div>
            <label className="input-label">Email Address</label>
            <input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="alice@example.com" />
          </div>
          <div>
            <label className="input-label">Department</label>
            <select className="select-field" value={form.department} onChange={set('department')} required>
              <option value="">Select department…</option>
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Phone (optional)</label>
            <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="+92-300-1234567" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><LoadingSpinner size="sm" /> Saving…</> : modal === 'add' ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={modal === 'enroll'} onClose={closeModal} title={`Enroll ${selected?.name}`}>
        <p className="text-slate-500 text-sm mb-4">Select a course to enroll this student in.</p>
        <div>
          <label className="input-label">Course</label>
          <select className="select-field" value={enrollCourse} onChange={e => setEnrollCourse(e.target.value)}>
            <option value="">Select course…</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        {selected?.enrolled_courses?.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-500 text-xs mb-2">Currently enrolled in:</p>
            <div className="flex flex-wrap gap-2">
              {courses.filter(c => selected.enrolled_courses.includes(c.id)).map(c => (
                <span key={c.id} className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">{c.code}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleEnroll} disabled={!enrollCourse || saving} className="btn-primary flex-1">
            {saving ? <LoadingSpinner size="sm" /> : 'Enroll'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Student" loading={deleting}
        message={`Are you sure you want to delete "${confirmDel?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
