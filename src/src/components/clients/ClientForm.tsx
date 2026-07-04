import type { FormEvent, ReactNode } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { CreateClientModel } from '@/types/apiModels'
import { toDateInputValue } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

export type ClientFormValues = CreateClientModel

interface ClientFormProps {
  form: ClientFormValues
  onChange: <K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  errorMessage?: string | null
  actions: ReactNode
}

export function clientFormFromDto(client: ClientFormValues & { clientId?: string }): ClientFormValues {
  return {
    firstName: client.firstName ?? '',
    lastName: client.lastName ?? '',
    legalName: client.legalName ?? '',
    householdName: client.householdName ?? '',
    primaryPhone: client.primaryPhone ?? '',
    addressLine1: client.addressLine1 ?? '',
    addressLine2: client.addressLine2 ?? '',
    city: client.city ?? '',
    state: client.state ?? '',
    postalCode: client.postalCode ?? '',
    emailAddress: client.emailAddress ?? '',
    dateOfBirth: toDateInputValue(client.dateOfBirth),
    medicareNumber: client.medicareNumber ?? '',
    medicarePartAEffectiveDate: toDateInputValue(client.medicarePartAEffectiveDate),
    medicarePartBEffectiveDate: toDateInputValue(client.medicarePartBEffectiveDate),
    isActive: client.isActive ?? true,
    isAcaClient: client.isAcaClient ?? false,
    hasContactConsent: client.hasContactConsent ?? false,
    notes: client.notes ?? '',
  }
}

export const emptyClientForm: ClientFormValues = {
  firstName: '',
  lastName: '',
  legalName: '',
  householdName: '',
  primaryPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  emailAddress: '',
  dateOfBirth: '',
  medicareNumber: '',
  medicarePartAEffectiveDate: '',
  medicarePartBEffectiveDate: '',
  isActive: true,
  isAcaClient: false,
  hasContactConsent: false,
  notes: '',
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function clientFormToPayload(form: ClientFormValues): CreateClientModel {
  return {
    firstName: emptyToNull(form.firstName),
    lastName: emptyToNull(form.lastName),
    legalName: emptyToNull(form.legalName),
    householdName: emptyToNull(form.householdName),
    primaryPhone: emptyToNull(form.primaryPhone),
    addressLine1: emptyToNull(form.addressLine1),
    addressLine2: emptyToNull(form.addressLine2),
    city: emptyToNull(form.city),
    state: emptyToNull(form.state),
    postalCode: emptyToNull(form.postalCode),
    emailAddress: emptyToNull(form.emailAddress),
    dateOfBirth: emptyToNull(form.dateOfBirth),
    medicareNumber: emptyToNull(form.medicareNumber),
    medicarePartAEffectiveDate: emptyToNull(form.medicarePartAEffectiveDate),
    medicarePartBEffectiveDate: emptyToNull(form.medicarePartBEffectiveDate),
    isActive: form.isActive ?? true,
    isAcaClient: form.isAcaClient ?? false,
    hasContactConsent: form.hasContactConsent ?? false,
    notes: emptyToNull(form.notes),
  }
}

export function ClientForm({
  form,
  onChange,
  onSubmit,
  errorMessage,
  actions,
}: ClientFormProps) {
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="First name"
          value={form.firstName ?? ''}
          onChange={(event) => onChange('firstName', event.target.value)}
        />
        <Input
          label="Last name"
          value={form.lastName ?? ''}
          onChange={(event) => onChange('lastName', event.target.value)}
        />
        <Input
          label="Legal name"
          value={form.legalName ?? ''}
          onChange={(event) => onChange('legalName', event.target.value)}
        />
        <Input
          label="Household name"
          value={form.householdName ?? ''}
          onChange={(event) => onChange('householdName', event.target.value)}
        />
        <Input
          label="Primary phone"
          value={form.primaryPhone ?? ''}
          onChange={(event) => onChange('primaryPhone', event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={form.emailAddress ?? ''}
          onChange={(event) => onChange('emailAddress', event.target.value)}
        />
        <Input
          label="Address line 1"
          value={form.addressLine1 ?? ''}
          onChange={(event) => onChange('addressLine1', event.target.value)}
        />
        <Input
          label="Address line 2"
          value={form.addressLine2 ?? ''}
          onChange={(event) => onChange('addressLine2', event.target.value)}
        />
        <Input
          label="City"
          value={form.city ?? ''}
          onChange={(event) => onChange('city', event.target.value)}
        />
        <Input
          label="State"
          value={form.state ?? ''}
          onChange={(event) => onChange('state', event.target.value)}
        />
        <Input
          label="Postal code"
          value={form.postalCode ?? ''}
          onChange={(event) => onChange('postalCode', event.target.value)}
        />
        <Input
          label="Date of birth"
          type="date"
          value={form.dateOfBirth ?? ''}
          onChange={(event) => onChange('dateOfBirth', event.target.value)}
        />
        <Input
          label="Medicare number"
          value={form.medicareNumber ?? ''}
          onChange={(event) => onChange('medicareNumber', event.target.value)}
        />
        <Input
          label="Part A effective date"
          type="date"
          value={form.medicarePartAEffectiveDate ?? ''}
          onChange={(event) =>
            onChange('medicarePartAEffectiveDate', event.target.value)
          }
        />
        <Input
          label="Part B effective date"
          type="date"
          value={form.medicarePartBEffectiveDate ?? ''}
          onChange={(event) =>
            onChange('medicarePartBEffectiveDate', event.target.value)
          }
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className={ui.text.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(event) => onChange('isActive', event.target.checked)}
            className={ui.field.checkbox}
          />
          Active client
        </label>
        <label className={ui.text.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.isAcaClient ?? false}
            onChange={(event) => onChange('isAcaClient', event.target.checked)}
            className={ui.field.checkbox}
          />
          ACA client
        </label>
        <label className={ui.text.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.hasContactConsent ?? false}
            onChange={(event) =>
              onChange('hasContactConsent', event.target.checked)
            }
            className={ui.field.checkbox}
          />
          Contact consent on file
        </label>
      </div>

      <Textarea
        label="Notes"
        value={form.notes ?? ''}
        onChange={(event) => onChange('notes', event.target.value)}
      />

      {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}

      {actions}
    </form>
  )
}
