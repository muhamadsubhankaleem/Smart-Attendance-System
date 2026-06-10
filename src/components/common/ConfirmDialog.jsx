import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-content w-full max-w-sm bg-[#0d1526] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-rose-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
