import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className={ui.surface.header}>
      <div>
        <h1 className={ui.text.pageTitle}>{title}</h1>
        {subtitle ? <p className={cn('mt-1', ui.text.mutedSm)}>{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
