export default function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className={`stat-icon ${iconBg || 'bg-indigo-500/15 border border-indigo-500/20'}`}>
        {Icon && <Icon size={22} className={gradient ? 'text-white' : 'text-indigo-400'} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
