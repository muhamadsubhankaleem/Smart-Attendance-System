const STATUS_MAP = {
  present: { cls: 'badge-present', label: 'Present', dot: 'bg-emerald-400' },
  absent:  { cls: 'badge-absent',  label: 'Absent',  dot: 'bg-rose-400' },
  late:    { cls: 'badge-late',    label: 'Late',    dot: 'bg-amber-400' },
  admin:   { cls: 'badge-admin',   label: 'Admin',   dot: 'bg-indigo-400' },
  student: { cls: 'badge-student', label: 'Student', dot: 'bg-violet-400' },
}

export default function Badge({ status, custom }) {
  const config = STATUS_MAP[status?.toLowerCase()] || { cls: 'badge bg-white/10 text-slate-400 border border-white/10', label: status, dot: 'bg-slate-400' }
  return (
    <span className={config.cls || 'badge'}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {custom || config.label}
    </span>
  )
}
