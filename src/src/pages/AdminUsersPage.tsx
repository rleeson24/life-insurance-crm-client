import { useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, UserPlus } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import {
  createOrganizationUser,
  listOrganizationUsers,
  updateOrganizationUser,
} from '@/api/organizationUsers'
import { ApiError } from '@/api/apiFetch'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'
import type { OrganizationUserDto } from '@/types/apiModels'

const roles = ['Admin', 'Agent', 'ReadOnly'] as const

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CreateForm {
  userId: string
  displayName: string
  emailAddress: string
  role: string
  createNewTenant: boolean
  newTenantName: string
}

const emptyForm: CreateForm = {
  userId: '',
  displayName: '',
  emailAddress: '',
  role: 'Agent',
  createNewTenant: false,
  newTenantName: '',
}

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })

  const usersQuery = useQuery({
    queryKey: queryKeys.organizationUsers,
    queryFn: ({ signal }) => listOrganizationUsers({ signal }),
    enabled: meQuery.data?.role === 'Admin',
  })

  const createMutation = useMutation({
    mutationFn: createOrganizationUser,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizationUsers })
      setFormOpen(false)
      setForm(emptyForm)
      setErrorMessage(null)
      setSuccessMessage(
        created.tenantId !== meQuery.data?.tenantId
          ? `Added ${created.displayName} to a new organization (${created.tenantId}). They will not appear in this list.`
          : `Added ${created.displayName}.`,
      )
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to add user.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      organizationUserId,
      ...model
    }: {
      organizationUserId: string
      displayName: string
      emailAddress?: string | null
      role: string
      isActive: boolean
    }) => updateOrganizationUser(organizationUserId, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizationUsers })
      setErrorMessage(null)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to update user.',
      )
    },
  })

  const tenantName = useMemo(
    () => usersQuery.data?.[0]?.tenantName ?? 'this organization',
    [usersQuery.data],
  )

  if (meQuery.isLoading) {
    return <SkeletonRows rows={6} />
  }

  if (meQuery.isError || meQuery.data?.role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    const userId = form.userId.trim()
    if (!guidPattern.test(userId)) {
      setErrorMessage(
        'Entra object ID must be a GUID (Users → Object ID). Do not paste NameIdentifier/sub.',
      )
      return
    }

    createMutation.mutate({
      userId,
      displayName: form.displayName.trim(),
      emailAddress: form.emailAddress.trim() || null,
      role: form.role,
      createNewTenant: form.createNewTenant,
      newTenantName: form.createNewTenant ? form.newTenantName.trim() : null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={ui.text.mutedSm}>
          Map people who already exist in Entra. Isolation is by CRM tenant (
          {tenantName}), not by Entra directory ID.
        </p>
        <Button
          type="button"
          onClick={() => {
            setForm(emptyForm)
            setErrorMessage(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add user
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
        {usersQuery.isLoading ? (
          <SkeletonRows rows={6} />
        ) : usersQuery.isError ? (
          <EmptyState
            title="Unable to load users"
            description="Check that the API is running and that you are an administrator."
          />
        ) : usersQuery.data?.length === 0 ? (
          <EmptyState
            title="No users in this organization"
            description="Add an Entra user by their Object ID."
            action={
              <Button type="button" onClick={() => setFormOpen(true)}>
                Add user
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={ui.table.head}>
                <tr>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Entra object ID</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className={ui.table.body}>
                {usersQuery.data?.map((user) => (
                  <UserRow
                    key={user.organizationUserId}
                    user={user}
                    disabled={updateMutation.isPending}
                    onChange={(patch) =>
                      updateMutation.mutate({
                        organizationUserId: user.organizationUserId,
                        displayName: user.displayName ?? '',
                        emailAddress: user.emailAddress,
                        role: user.role,
                        isActive: user.isActive,
                        ...patch,
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
        title="Add organization user"
        onClose={() => setFormOpen(false)}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}
          <Input
            label="Entra object ID (oid)"
            value={form.userId}
            onChange={(event) =>
              setForm((current) => ({ ...current, userId: event.target.value }))
            }
            placeholder="e1da25de-af92-4e5c-a9ac-1bc186bb9a4f"
            required
          />
          <Input
            label="Display name"
            value={form.displayName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.emailAddress}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                emailAddress: event.target.value,
              }))
            }
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={ui.text.label}>Role</span>
            <select
              className={ui.field.control}
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.text.checkboxLabel}>
            <input
              type="checkbox"
              className={ui.field.checkbox}
              checked={form.createNewTenant}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  createNewTenant: event.target.checked,
                }))
              }
            />
            Create a new CRM organization (isolated data)
          </label>
          {form.createNewTenant ? (
            <Input
              label="New organization name"
              value={form.newTenantName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  newTenantName: event.target.value,
                }))
              }
              required
            />
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              <UserPlus className="h-4 w-4" />
              Add user
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function UserRow({
  user,
  disabled,
  onChange,
}: {
  user: OrganizationUserDto
  disabled: boolean
  onChange: (patch: { role?: string; isActive?: boolean }) => void
}) {
  return (
    <tr className={ui.table.row}>
      <td className="px-3 py-3">
        <div className={ui.text.itemTitle}>{user.displayName || '—'}</div>
        <div className={ui.text.mutedSm}>{user.emailAddress || '—'}</div>
      </td>
      <td className={`px-3 py-3 font-mono text-xs ${ui.text.secondary}`}>
        {user.userId}
      </td>
      <td className="px-3 py-3">
        <select
          className={ui.field.control}
          value={user.role}
          disabled={disabled}
          aria-label={`Role for ${user.displayName ?? user.userId}`}
          onChange={(event) => onChange({ role: event.target.value })}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={disabled}
          className="rounded-full"
          onClick={() => onChange({ isActive: !user.isActive })}
        >
          <Badge variant={user.isActive ? 'success' : 'muted'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </button>
      </td>
    </tr>
  )
}
