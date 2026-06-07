export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' }
  return (
    <div className={`${sizes[size]} rounded-full border-white/20 border-t-indigo-400 animate-spin ${className}`} />
  )
}
