import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/format'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ className, label, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? (
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
      ) : null}
      <textarea
        id={textareaId}
        className={cn(
          'min-h-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40 dark:disabled:bg-slate-800',
          className,
        )}
        {...props}
      />
    </label>
  )
}
