import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type {
  CreateSecondaryEnrollmentModel,
  SecondaryEnrollmentDto,
} from '@/types/apiModels'
import { toDateInputValue, toDatetimeLocalValue, toIsoFromDatetimeLocal } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

export type SecondaryEnrollmentFormValues = {
  recordedAtLocal: string
  planOrCarrierName: string
  coverageStartDate: string
  isActiveCoverage: boolean
  notes: string
}

export function secondaryEnrollmentFormEmpty(): SecondaryEnrollmentFormValues {
  return {
    recordedAtLocal: toDatetimeLocalValue(),
    planOrCarrierName: '',
    coverageStartDate: '',
    isActiveCoverage: true,
    notes: '',
  }
}

export function secondaryEnrollmentFormFromDto(
  enrollment: SecondaryEnrollmentDto,
): SecondaryEnrollmentFormValues {
  return {
    recordedAtLocal: toDatetimeLocalValue(enrollment.recordedAt),
    planOrCarrierName: enrollment.planOrCarrierName ?? '',
    coverageStartDate: toDateInputValue(enrollment.coverageStartDate),
    isActiveCoverage: enrollment.isActiveCoverage,
    notes: enrollment.notes ?? '',
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function secondaryEnrollmentFormToPayload(
  form: SecondaryEnrollmentFormValues,
): CreateSecondaryEnrollmentModel {
  return {
    recordedAt: toIsoFromDatetimeLocal(form.recordedAtLocal),
    planOrCarrierName: emptyToNull(form.planOrCarrierName),
    coverageStartDate: emptyToNull(form.coverageStartDate),
    isActiveCoverage: form.isActiveCoverage,
    notes: emptyToNull(form.notes),
  }
}

interface SecondaryEnrollmentFormProps {
  form: SecondaryEnrollmentFormValues
  onChange: <K extends keyof SecondaryEnrollmentFormValues>(
    key: K,
    value: SecondaryEnrollmentFormValues[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
  errorMessage?: string | null
}

export function SecondaryEnrollmentForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  errorMessage,
}: SecondaryEnrollmentFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Recorded at"
        type="datetime-local"
        value={form.recordedAtLocal}
        onChange={(event) => onChange('recordedAtLocal', event.target.value)}
      />
      <Input
        label="Plan or carrier name"
        value={form.planOrCarrierName}
        onChange={(event) => onChange('planOrCarrierName', event.target.value)}
      />
      <Input
        label="Coverage start date"
        type="date"
        value={form.coverageStartDate}
        onChange={(event) => onChange('coverageStartDate', event.target.value)}
      />

      <label className={ui.text.checkboxLabel}>
        <input
          type="checkbox"
          checked={form.isActiveCoverage}
          onChange={(event) => onChange('isActiveCoverage', event.target.checked)}
          className={ui.field.checkbox}
        />
        Active coverage
      </label>

      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(event) => onChange('notes', event.target.value)}
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
