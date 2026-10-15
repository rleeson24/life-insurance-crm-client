import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import { createTenant, listTenants, updateTenant } from '@/api/tenants'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { cn } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { isSuperAdmin } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'
import type { CreateTenantModel, TenantDto, UpdateTenantModel } from '@/types/apiModels'

type OrganizationDraft = {
  tenantId: string | null
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  noticesEmail: string
  incidentContact: string
  incidentTelephone: string
}

const emptyDraft = (): OrganizationDraft => ({
  tenantId: null,
  name: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  noticesEmail: '',
  incidentContact: '',
  incidentTelephone: '',
})

function draftFromTenant(tenant: TenantDto): OrganizationDraft {
  return {
    tenantId: tenant.tenantId,
    name: tenant.name,
    addressLine1: tenant.addressLine1 ?? '',
    addressLine2: tenant.addressLine2 ?? '',
    city: tenant.city ?? '',
    state: tenant.state ?? '',
    postalCode: tenant.postalCode ?? '',
    noticesEmail: tenant.noticesEmail ?? '',
    incidentContact: tenant.incidentContact ?? '',
    incidentTelephone: tenant.incidentTelephone ?? '',
  }
}

export function AdminTenantsPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<OrganizationDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const platformOperator = isSuperAdmin(meQuery.data?.role)

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants,
    queryFn: ({ signal }) => listTenants({ signal }),
    enabled: platformOperator,
  })

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants })
      setDraft(null)
      setErrorMessage(null)
      setSuccessMessage(`Created ${created.name}. Add an administrator from Users.`)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to create organization.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      tenantId,
      ...model
    }: {
      tenantId: string
    } & UpdateTenantModel) => updateTenant(tenantId, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants })
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
      queryClient.invalidateQueries({ queryKey: ['organization-users'] })
      setErrorMessage(null)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to update organization.',
      )
    },
  })

  if (meQuery.isLoading) {
    return <SkeletonRows rows={6} />
  }

  if (meQuery.isError || !platformOperator) {
    return <Navigate to="/" replace />
  }

  function openCreate() {
    setDraft(emptyDraft())
    setErrorMessage(null)
  }

  function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) {
      return
    }

    setErrorMessage(null)
    const name = draft.name.trim()
    if (!name) {
      setErrorMessage('Organization name is required.')
      return
    }

    const state = draft.state.trim().toUpperCase()
    if (state && state.length !== 2) {
      setErrorMessage('State must be a 2-character code.')
      return
    }

    const model: CreateTenantModel = {
      name,
      addressLine1: draft.addressLine1.trim(),
      addressLine2: draft.addressLine2.trim(),
      city: draft.city.trim(),
      state,
      postalCode: draft.postalCode.trim(),
      noticesEmail: draft.noticesEmail.trim(),
      incidentContact: draft.incidentContact.trim(),
      incidentTelephone: draft.incidentTelephone.trim(),
    }

    if (draft.tenantId) {
      updateMutation.mutate(
        { tenantId: draft.tenantId, ...model },
        {
          onSuccess: (updated) => {
            setDraft(null)
            setSuccessMessage(`Updated ${updated.name}.`)
          },
        },
      )
      return
    }

    createMutation.mutate(model)
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className={ui.text.mutedSm}>
          CRM organizations isolate client data. Record a mailing address, notices
          email, and incident contact for each organization. Mark an organization
          inactive when they stop using the app; their users cannot sign in until
          you reactivate it.
        </p>
        <Button type="button" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add organization
        </Button>
      </div>

      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      {errorMessage && !draft ? (
        <p className={ui.text.errorBanner}>{errorMessage}</p>
      ) : null}

      {tenantsQuery.isLoading ? (
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      ) : tenantsQuery.isError ? (
        <Card>
          <EmptyState
            title="Unable to load organizations"
            description="Check that the API is running and that you are a SuperAdmin."
          />
        </Card>
      ) : tenantsQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No organizations"
            description="Create a CRM organization, then add its first administrator from Users."
            action={
              <Button type="button" onClick={openCreate}>
                Add organization
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {tenantsQuery.data?.map((tenant) => (
              <li key={tenant.tenantId}>
                <TenantCard
                  tenant={tenant}
                  disabled={updateMutation.isPending}
                  onEdit={() => {
                    setErrorMessage(null)
                    setDraft(draftFromTenant(tenant))
                  }}
                  onStatusChange={(isActive) =>
                    updateMutation.mutate({
                      tenantId: tenant.tenantId,
                      isActive,
                    })
                  }
                />
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className={ui.table.head}>
                  <tr>
                    <th className="px-3 py-3 font-medium">Organization</th>
                    <th className="px-3 py-3 font-medium">Notices email</th>
                    <th className="px-3 py-3 font-medium">Incident contact</th>
                    <th className="px-3 py-3 font-medium">Tenant ID</th>
                    <th className="px-3 py-3 font-medium">Clients</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={ui.table.body}>
                  {tenantsQuery.data?.map((tenant) => (
                    <TenantRow
                      key={tenant.tenantId}
                      tenant={tenant}
                      disabled={updateMutation.isPending}
                      onEdit={() => {
                        setErrorMessage(null)
                        setDraft(draftFromTenant(tenant))
                      }}
                      onStatusChange={(isActive) =>
                        updateMutation.mutate({
                          tenantId: tenant.tenantId,
                          isActive,
                        })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={draft !== null}
        title={draft?.tenantId ? 'Edit organization' : 'Add organization'}
        onClose={() => setDraft(null)}
        className="max-w-2xl"
      >
        {draft ? (
          <form className="space-y-4" onSubmit={submitOrganization}>
            {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}
            <OrganizationFields
              draft={draft}
              onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
            />
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                <Building2 className="h-4 w-4" />
                {draft.tenantId ? 'Save organization' : 'Add organization'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

function OrganizationFields({
  draft,
  onChange,
}: {
  draft: OrganizationDraft
  onChange: (patch: Partial<OrganizationDraft>) => void
}) {
  return (
    <>
      <Input
        label="Organization name"
        value={draft.name}
        onChange={(event) => onChange({ name: event.target.value })}
        required
      />
      <FormSection title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Address line 1"
              autoComplete="address-line1"
              value={draft.addressLine1}
              onChange={(event) => onChange({ addressLine1: event.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Address line 2"
              autoComplete="address-line2"
              value={draft.addressLine2}
              onChange={(event) => onChange({ addressLine2: event.target.value })}
            />
          </div>
          <Input
            label="City"
            autoComplete="address-level2"
            value={draft.city}
            onChange={(event) => onChange({ city: event.target.value })}
          />
          <Input
            label="State"
            autoComplete="address-level1"
            value={draft.state}
            onChange={(event) => onChange({ state: event.target.value })}
          />
          <Input
            label="Postal code"
            autoComplete="postal-code"
            value={draft.postalCode}
            onChange={(event) => onChange({ postalCode: event.target.value })}
          />
        </div>
      </FormSection>
      <FormSection title="Notices">
        <Input
          label="Notices email"
          type="email"
          autoComplete="email"
          value={draft.noticesEmail}
          onChange={(event) => onChange({ noticesEmail: event.target.value })}
        />
      </FormSection>
      <FormSection title="Incident">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Incident contact"
            autoComplete="name"
            value={draft.incidentContact}
            onChange={(event) => onChange({ incidentContact: event.target.value })}
          />
          <Input
            label="Incident telephone"
            type="tel"
            autoComplete="tel"
            value={draft.incidentTelephone}
            onChange={(event) => onChange({ incidentTelephone: event.target.value })}
          />
        </div>
      </FormSection>
    </>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={ui.surface.formSection}>
      <legend className={cn('px-1', ui.text.subsectionTitle)}>{title}</legend>
      {children}
    </fieldset>
  )
}

function TenantCard({
  tenant,
  disabled,
  onEdit,
  onStatusChange,
}: {
  tenant: TenantDto
  disabled: boolean
  onEdit: () => void
  onStatusChange: (isActive: boolean) => void
}) {
  return (
    <article className={ui.surface.listCard}>
      <OrganizationIdentity tenant={tenant} />
      <ContactDetails tenant={tenant} />
      <p className={`mt-2 break-all font-mono text-xs ${ui.text.secondary}`}>
        {tenant.tenantId}
      </p>
      <p className={`mt-2 text-sm ${ui.text.secondary}`}>
        {formatClientCount(tenant.clientCount)}
      </p>
      <div className="mt-3 space-y-3">
        <TenantStatusSelect
          tenant={tenant}
          disabled={disabled}
          onStatusChange={onStatusChange}
        />
        <EditOrganizationButton tenant={tenant} disabled={disabled} onEdit={onEdit} />
      </div>
    </article>
  )
}

function TenantRow({
  tenant,
  disabled,
  onEdit,
  onStatusChange,
}: {
  tenant: TenantDto
  disabled: boolean
  onEdit: () => void
  onStatusChange: (isActive: boolean) => void
}) {
  return (
    <tr className={ui.table.row}>
      <td className="px-3 py-3">
        <OrganizationIdentity tenant={tenant} />
      </td>
      <td className={`px-3 py-3 break-all ${ui.text.secondary}`}>
        {tenant.noticesEmail || '—'}
      </td>
      <td className="px-3 py-3">
        <IncidentContact tenant={tenant} />
      </td>
      <td className={`px-3 py-3 font-mono text-xs ${ui.text.secondary}`}>
        {tenant.tenantId}
      </td>
      <td className={`px-3 py-3 tabular-nums ${ui.text.secondary}`}>
        {tenant.clientCount.toLocaleString()}
      </td>
      <td className="px-3 py-3">
        <TenantStatusSelect
          tenant={tenant}
          disabled={disabled}
          onStatusChange={onStatusChange}
        />
      </td>
      <td className="px-3 py-3">
        <EditOrganizationButton tenant={tenant} disabled={disabled} onEdit={onEdit} />
      </td>
    </tr>
  )
}

function OrganizationIdentity({ tenant }: { tenant: TenantDto }) {
  const lines = addressLines(tenant)
  return (
    <div>
      <div className={ui.text.itemTitle}>{tenant.name}</div>
      {lines.map((line, index) => (
        <div key={`${tenant.tenantId}-${index}`} className={`text-xs ${ui.text.secondary}`}>
          {line}
        </div>
      ))}
    </div>
  )
}

function ContactDetails({ tenant }: { tenant: TenantDto }) {
  return (
    <div className="mt-3 space-y-2">
      <div>
        <p className={ui.text.detailLabel}>Notices email</p>
        <p className={`${ui.text.detailValue} break-all`}>{tenant.noticesEmail || '—'}</p>
      </div>
      <div>
        <p className={ui.text.detailLabel}>Incident contact</p>
        <div className={ui.text.detailValue}>
          <IncidentContact tenant={tenant} />
        </div>
      </div>
    </div>
  )
}

function IncidentContact({ tenant }: { tenant: TenantDto }) {
  if (!tenant.incidentContact && !tenant.incidentTelephone) {
    return <span className={ui.text.muted}>—</span>
  }

  return (
    <div>
      {tenant.incidentContact ? <div>{tenant.incidentContact}</div> : null}
      {tenant.incidentTelephone ? (
        <div className={`text-xs ${ui.text.secondary}`}>{tenant.incidentTelephone}</div>
      ) : null}
    </div>
  )
}

function EditOrganizationButton({
  tenant,
  disabled,
  onEdit,
}: {
  tenant: TenantDto
  disabled: boolean
  onEdit: () => void
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      aria-label={`Edit ${tenant.name}`}
      onClick={onEdit}
    >
      Edit
    </Button>
  )
}

function addressLines(tenant: TenantDto) {
  const region = [tenant.state, tenant.postalCode].filter(Boolean).join(' ')
  const locality = [tenant.city, region].filter(Boolean).join(', ')
  return [tenant.addressLine1, tenant.addressLine2, locality].filter(
    (line): line is string => Boolean(line),
  )
}

function formatClientCount(count: number) {
  const label = count === 1 ? 'client' : 'clients'
  return `${count.toLocaleString()} ${label}`
}

function TenantStatusSelect({
  tenant,
  disabled,
  onStatusChange,
}: {
  tenant: TenantDto
  disabled: boolean
  onStatusChange: (isActive: boolean) => void
}) {
  return (
    <select
      className={`${ui.field.control} w-full`}
      value={tenant.isActive ? 'active' : 'inactive'}
      disabled={disabled}
      aria-label={`Status for ${tenant.name}`}
      onChange={(event) => onStatusChange(event.target.value === 'active')}
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  )
}
