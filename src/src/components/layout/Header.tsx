import type { ReactNode, Ref } from 'react'
import { Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  menuOpen?: boolean
  menuButtonRef?: Ref<HTMLButtonElement>
  onMenuClick?: () => void
}

export function Header({
  title,
  subtitle,
  actions,
  menuOpen = false,
  menuButtonRef,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className={ui.surface.header}>
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick ? (
          <button
            ref={menuButtonRef}
            type="button"
            className={cn(ui.button.icon, 'lg:hidden')}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className={ui.text.pageTitle}>{title}</h1>
          {subtitle ? (
            <p className={cn('mt-0.5 truncate', ui.text.mutedSm)}>{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
