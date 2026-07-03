import { cn } from '@/lib/format'

type BadgeVariant = 'default' | 'success' | 'warning' | 'muted'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  muted: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
