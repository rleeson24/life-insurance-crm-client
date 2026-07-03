import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/format'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
