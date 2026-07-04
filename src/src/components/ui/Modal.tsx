import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[min(90vh,720px)] w-full flex-col rounded-xl border shadow-lg',
          ui.surface.card,
          className ?? 'max-w-lg',
        )}
      >
        <div className={cn(ui.surface.cardHeader, 'shrink-0')}>
          <h2 id="modal-title" className={ui.text.sectionTitle}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className={ui.text.secondary}>{description}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={cn(ui.button.base, ui.button.secondary)}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(ui.button.base, ui.button.danger)}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
