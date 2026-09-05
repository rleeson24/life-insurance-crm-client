import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type {
  CreateMajorMedicalEnrollmentModel,
  MajorMedicalEnrollmentDto,
} from '@/types/apiModels'
import { toDateInputValue, toDatetimeLocalValue, toIsoFromDatetimeLocal } from '@/lib/format'
import { normalizePlanNameInput } from '@/lib/planNames'
import { ui } from '@/lib/uiClasses'
import { HraRadioGroup } from '@/components/clients/HraRadioGroup'
import { usePlanNameField } from '@/components/clients/PlanNameField'

export type MajorMedicalEnrollmentFormValues = {
  recordedAtLocal: string
  isActivePlan: boolean
  planName: string
  coverageStartDate: string
  isNewEnrollment: boolean
  healthReimbursementArrangement: boolean
  enrollmentPlatform: string
  enrollmentLocation: string
  notes: string
}

export function majorMedicalEnrollmentFormEmpty(): MajorMedicalEnrollmentFormValues {
  return {
    recordedAtLocal: toDatetimeLocalValue(),
    isActivePlan: true,
    planName: '',
    coverageStartDate: '',
    isNewEnrollment: false,
    healthReimbursementArrangement: false,
    enrollmentPlatform: '',
    enrollmentLocation: '',
    notes: '',
  }
}

export function majorMedicalEnrollmentFormFromDto(
  enrollment: MajorMedicalEnrollmentDto,
): MajorMedicalEnrollmentFormValues {
  return {
    recordedAtLocal: toDatetimeLocalValue(enrollment.recordedAt),
    isActivePlan: enrollment.isActivePlan,
    planName: enrollment.planName ?? '',
    coverageStartDate: toDateInputValue(enrollment.coverageStartDate),
    isNewEnrollment: enrollment.isNewEnrollment,
    healthReimbursementArrangement: enrollment.healthReimbursementArrangement,
    enrollmentPlatform: enrollment.enrollmentPlatform ?? '',
    enrollmentLocation: enrollment.enrollmentLocation ?? '',
    notes: enrollment.notes ?? '',
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function majorMedicalEnrollmentFormToPayload(
  form: MajorMedicalEnrollmentFormValues,
): CreateMajorMedicalEnrollmentModel {
  return {
    recordedAt: toIsoFromDatetimeLocal(form.recordedAtLocal),
    isActivePlan: form.isActivePlan,
    planName: emptyToNull(normalizePlanNameInput(form.planName)),
    coverageStartDate: emptyToNull(form.coverageStartDate),
    isNewEnrollment: form.isNewEnrollment,
    healthReimbursementArrangement: form.healthReimbursementArrangement,
    enrollmentPlatform: emptyToNull(form.enrollmentPlatform),
    enrollmentLocation: emptyToNull(form.enrollmentLocation),
    notes: emptyToNull(form.notes),
  }
}

interface MajorMedicalEnrollmentFormProps {
  form: MajorMedicalEnrollmentFormValues
  onChange: <K extends keyof MajorMedicalEnrollmentFormValues>(
    key: K,
    value: MajorMedicalEnrollmentFormValues[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  submitLabel: string
  loading?: boolean
  errorMessage?: string | null
}

export function MajorMedicalEnrollmentForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  errorMessage,
}: MajorMedicalEnrollmentFormProps) {
  const planName = usePlanNameField({
    kind: 'medicare',
    coverageStartDate: form.coverageStartDate,
    label: 'Plan name',
    value: form.planName,
    onChange: (value) => onChange('planName', value),
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => planName.handleSubmit(event, onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Recorded at"
          type="datetime-local"
          value={form.recordedAtLocal}
          onChange={(event) => onChange('recordedAtLocal', event.target.value)}
        />
        <Input
          label="Coverage start date"
          type="date"
          value={form.coverageStartDate}
          onChange={(event) => onChange('coverageStartDate', event.target.value)}
        />
        {planName.field()}
        <Input
          label="Enrollment platform"
          value={form.enrollmentPlatform}
          onChange={(event) => onChange('enrollmentPlatform', event.target.value)}
        />
        <Input
          label="Enrollment location"
          value={form.enrollmentLocation}
          onChange={(event) => onChange('enrollmentLocation', event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className={ui.text.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.isActivePlan}
            onChange={(event) => onChange('isActivePlan', event.target.checked)}
            className={ui.field.checkbox}
          />
          Active
        </label>
        <label className={ui.text.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.isNewEnrollment}
            onChange={(event) => onChange('isNewEnrollment', event.target.checked)}
            className={ui.field.checkbox}
          />
          New to MA
        </label>
      </div>

      <Textarea
        label="Notes"
        rows={2}
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
      {planName.dialog()}
    </form>
  )
}
