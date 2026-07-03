import type { ReactNode } from 'react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
}

export function Card({
  children,
  className,
  title,
  description,
  action,
}: CardProps) {
  return (
    <section className={cn(ui.surface.card, className)}>
      {title || description || action ? (
        <header className={ui.surface.cardHeader}>
          <div>
            {title ? (
              <h2 className={ui.text.sectionTitle}>{title}</h2>
            ) : null}
            {description ? (
              <p className={cn('mt-1', ui.text.mutedSm)}>{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  )
}
