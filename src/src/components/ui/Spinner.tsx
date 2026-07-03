import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div className={cn(ui.feedback.spinner, className)} role="status" aria-live="polite">
      <Loader2 className={ui.feedback.spinnerIcon} />
      <span className="text-sm">{label}</span>
    </div>
  )
}
