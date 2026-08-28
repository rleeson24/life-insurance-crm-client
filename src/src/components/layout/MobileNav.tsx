import { useEffect, useId } from 'react'
import { cn } from '@/lib/format'
import { Sidebar } from '@/components/layout/Sidebar'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal={open}
        aria-labelledby={titleId}
        inert={open ? undefined : true}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] max-w-full flex-col shadow-2xl shadow-slate-950/40 transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full',
        )}
      >
        <h2 id={titleId} className="sr-only">
          Workspace navigation
        </h2>
        <Sidebar className="h-full w-full" onNavigate={onClose} onClose={onClose} />
      </div>
    </div>
  )
}
