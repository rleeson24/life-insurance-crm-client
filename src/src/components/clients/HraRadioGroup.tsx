import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface HraRadioGroupProps {
  name: string
  value: boolean
  onChange: (value: boolean) => void
}

export function HraRadioGroup({ name, value, onChange }: HraRadioGroupProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">HRA</legend>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <span className={ui.text.label} aria-hidden="true">
          HRA
        </span>
        <label className={cn(ui.text.checkboxLabel, 'whitespace-nowrap')}>
          <input
            type="radio"
            name={name}
            checked={value}
            onChange={() => onChange(true)}
            className={ui.field.radio}
          />
          Applies
        </label>
        <label className={cn(ui.text.checkboxLabel, 'whitespace-nowrap')}>
          <input
            type="radio"
            name={name}
            checked={!value}
            onChange={() => onChange(false)}
            className={ui.field.radio}
          />
          Doesn't apply
        </label>
      </div>
    </fieldset>
  )
}
