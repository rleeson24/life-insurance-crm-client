import { useState, type FormEvent } from 'react'
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
import { queryKeys } from '@/lib/queryKeys'
import { isSuperAdmin } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'
import type { TenantDto } from '@/types/apiModels'

export function AdminTenantsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
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
      setFormOpen(false)
      setName('')
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
      isActive?: boolean
      name?: string
    }) => updateTenant(tenantId, model),
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

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setErrorMessage('Organization name is required.')
      return
    }

    createMutation.mutate({ name: trimmed })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={ui.text.mutedSm}>
          CRM organizations isolate client data. Mark an organization inactive when
          they stop using the app; their users cannot sign in until you reactivate it.
        </p>
        <Button
          type="button"
          onClick={() => {
            setName('')
            setErrorMessage(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add organization
        </Button>
      </div>

      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      {errorMessage && !formOpen ? (
        <p className={ui.text.errorBanner}>{errorMessage}</p>
      ) : null}

      <Card>
        {tenantsQuery.isLoading ? (
          <SkeletonRows rows={6} />
        ) : tenantsQuery.isError ? (
          <EmptyState
            title="Unable to load organizations"
            description="Check that the API is running and that you are a SuperAdmin."
          />
        ) : tenantsQuery.data?.length === 0 ? (
          <EmptyState
            title="No organizations"
            description="Create a CRM organization, then add its first administrator from Users."
            action={
              <Button type="button" onClick={() => setFormOpen(true)}>
                Add organization
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={ui.table.head}>
                <tr>
                  <th className="px-3 py-3 font-medium">Organization</th>
                  <th className="px-3 py-3 font-medium">Tenant ID</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className={ui.table.body}>
                {tenantsQuery.data?.map((tenant) => (
                  <TenantRow
                    key={tenant.tenantId}
                    tenant={tenant}
                    disabled={updateMutation.isPending}
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
        )}
      </Card>

      <Modal
        open={formOpen}
        title="Add organization"
        onClose={() => setFormOpen(false)}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}
          <Input
            label="Organization name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              <Building2 className="h-4 w-4" />
              Add organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function TenantRow({
  tenant,
  disabled,
  onStatusChange,
}: {
  tenant: TenantDto
  disabled: boolean
  onStatusChange: (isActive: boolean) => void
}) {
  return (
    <tr className={ui.table.row}>
      <td className="px-3 py-3">
        <div className={ui.text.itemTitle}>{tenant.name}</div>
      </td>
      <td className={`px-3 py-3 font-mono text-xs ${ui.text.secondary}`}>
        {tenant.tenantId}
      </td>
      <td className="px-3 py-3">
        <select
          className={ui.field.control}
          value={tenant.isActive ? 'active' : 'inactive'}
          disabled={disabled}
          aria-label={`Status for ${tenant.name}`}
          onChange={(event) =>
            onStatusChange(event.target.value === 'active')
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
    </tr>
  )
}
