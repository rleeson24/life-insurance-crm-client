import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ className, label, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className={ui.text.label}>{label}</span> : null}
      <textarea
        id={textareaId}
        className={cn('min-h-24', ui.field.control, className)}
        {...props}
      />
    </label>
  )
}
