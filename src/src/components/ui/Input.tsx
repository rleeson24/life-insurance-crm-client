import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className={ui.text.label}>{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          ui.field.control,
          error ? ui.field.controlError : '',
          className,
        )}
        {...props}
      />
      {error ? <span className={ui.text.error}>{error}</span> : null}
    </label>
  )
}
