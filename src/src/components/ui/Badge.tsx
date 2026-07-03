import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

type BadgeVariant = 'default' | 'success' | 'warning' | 'muted'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: ui.badge.default,
  success: ui.badge.success,
  warning: ui.badge.warning,
  muted: ui.badge.muted,
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span className={cn(ui.badge.base, variantClasses[variant], className)}>
      {children}
    </span>
  )
}
