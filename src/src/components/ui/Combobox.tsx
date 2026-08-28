import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

export interface ComboboxOption {
  id: string
  label: string
  value: string
}

interface ComboboxProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  inputRef?: Ref<HTMLInputElement>
}

export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  inputRef,
}: ComboboxProps) {
  const listId = useId()
  const optionId = useId()
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    )
  }, [options, value])

  useEffect(() => {
    setHighlightIndex(0)
  }, [filtered])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function selectOption(option: ComboboxOption) {
    onChange(option.value)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlightIndex((current) =>
        filtered.length === 0 ? 0 : Math.min(current + 1, filtered.length - 1),
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setHighlightIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter' && open && filtered[highlightIndex]) {
      event.preventDefault()
      selectOption(filtered[highlightIndex])
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const activeOptionId =
    open && filtered[highlightIndex] ? `${optionId}-${filtered[highlightIndex].id}` : undefined

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5 text-sm">
      <span className={ui.text.label}>{label}</span>
      <input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        className={cn(ui.field.control, 'w-full')}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            'absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border py-1 shadow-lg',
            ui.border.default,
            'bg-white dark:bg-slate-900',
          )}
        >
          {filtered.map((option, index) => {
            const isActive = index === highlightIndex
            return (
              <li key={option.id} role="none">
                <button
                  type="button"
                  id={`${optionId}-${option.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'block w-full px-3 py-2 text-left text-sm',
                    isActive
                      ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'
                      : cn(ui.text.primary, 'hover:bg-slate-50 dark:hover:bg-slate-800'),
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
