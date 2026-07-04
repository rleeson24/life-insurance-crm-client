import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type {
  ClientInteractionDto,
  CreateClientInteractionModel,
} from '@/types/apiModels'
import { toDatetimeLocalValue, toIsoFromDatetimeLocal } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

export type ClientInteractionFormValues = {
  contactedAtLocal: string
  summary: string
  notes: string
  requiresFollowUp: boolean
}

export function clientInteractionFormEmpty(): ClientInteractionFormValues {
  return {
    contactedAtLocal: toDatetimeLocalValue(),
    summary: '',
    notes: '',
    requiresFollowUp: false,
  }
}

export function clientInteractionFormFromDto(
  interaction: ClientInteractionDto,
): ClientInteractionFormValues {
  return {
    contactedAtLocal: toDatetimeLocalValue(interaction.contactedAt),
    summary: interaction.summary ?? '',
    notes: interaction.notes ?? '',
    requiresFollowUp: interaction.requiresFollowUp,
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function clientInteractionFormToPayload(
  form: ClientInteractionFormValues,
): CreateClientInteractionModel {
  return {
    contactedAt: toIsoFromDatetimeLocal(form.contactedAtLocal),
    summary: emptyToNull(form.summary),
    notes: emptyToNull(form.notes),
    requiresFollowUp: form.requiresFollowUp,
  }
}

interface ClientInteractionFormProps {
  form: ClientInteractionFormValues
  onChange: <K extends keyof ClientInteractionFormValues>(
    key: K,
    value: ClientInteractionFormValues[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
  errorMessage?: string | null
}

export function ClientInteractionForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  errorMessage,
}: ClientInteractionFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Contacted at"
          type="datetime-local"
          value={form.contactedAtLocal}
          onChange={(event) => onChange('contactedAtLocal', event.target.value)}
        />
        <Input
          label="Summary"
          value={form.summary}
          onChange={(event) => onChange('summary', event.target.value)}
        />
      </div>

      <label className={ui.text.checkboxLabel}>
        <input
          type="checkbox"
          checked={form.requiresFollowUp}
          onChange={(event) => onChange('requiresFollowUp', event.target.checked)}
          className={ui.field.checkbox}
        />
        Requires follow-up
      </label>

      <Textarea
        label="Notes"
        rows={3}
        value={form.notes}
        onChange={(event) => onChange('notes', event.target.value)}
        className="min-h-0"
      />

      {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
