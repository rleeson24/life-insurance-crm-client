import { useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import {
  clonePlanNames,
  createPlanName,
  deletePlanName,
  listPlanNames,
  updatePlanName,
} from '@/api/planNames'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { queryKeys } from '@/lib/queryKeys'
import { canManageOrganizationUsers } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'
import type { PlanNameDto, PlanNameKind } from '@/types/apiModels'

const tabs: Array<{ id: PlanNameKind; label: string }> = [
  { id: 'medicare', label: 'Medicare' },
  { id: 'drug', label: 'Drug plans' },
  { id: 'secondary', label: 'Secondary' },
]

const kindLabels: Record<PlanNameKind, string> = {
  medicare: 'Medicare',
  drug: 'drug plan',
  secondary: 'secondary',
}

function currentCalendarYear() {
  return new Date().getFullYear()
}

function yearOptions(selectedYear: number) {
  const current = currentCalendarYear()
  const years: number[] = []
  for (let year = current + 1; year >= current - 10; year -= 1) {
    years.push(year)
  }
  if (!years.includes(selectedYear)) {
    years.push(selectedYear)
    years.sort((a, b) => b - a)
  }
  return years
}

export function AdminPlanNamesPage() {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<PlanNameKind>('medicare')
  const [year, setYear] = useState(currentCalendarYear)
  const [formOpen, setFormOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PlanNameDto | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const canManage = canManageOrganizationUsers(meQuery.data?.role)

  const listQuery = useQuery({
    queryKey: queryKeys.planNames(kind, year),
    queryFn: ({ signal }) => listPlanNames(kind, year, { signal }),
    enabled: canManage,
  })

  function invalidateLists() {
    queryClient.invalidateQueries({ queryKey: ['plan-names'] })
    queryClient.invalidateQueries({ queryKey: ['plan-name-lookup'] })
  }

  const createMutation = useMutation({
    mutationFn: () => createPlanName(kind, { planYear: year, name: formName.trim() }),
    onSuccess: (created) => {
      invalidateLists()
      setFormOpen(false)
      setFormName('')
      setErrorMessage(null)
      setSuccessMessage(`Added ${created.name}.`)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to add plan name.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ planNameId, name }: { planNameId: string; name: string }) =>
      updatePlanName(kind, planNameId, { name }),
    onSuccess: (updated) => {
      invalidateLists()
      setEditingId(null)
      setErrorMessage(null)
      setSuccessMessage(`Updated ${updated.name}.`)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to update plan name.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (planNameId: string) => deletePlanName(kind, planNameId),
    onSuccess: () => {
      invalidateLists()
      setDeleteTarget(null)
      setErrorMessage(null)
      setSuccessMessage('Removed plan name.')
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to delete plan name.',
      )
      setDeleteTarget(null)
    },
  })

  const cloneMutation = useMutation({
    mutationFn: () =>
      clonePlanNames(kind, { sourceYear: year - 1, targetYear: year }),
    onSuccess: (result) => {
      invalidateLists()
      setErrorMessage(null)
      if (result.sourceCount === 0) {
        setSuccessMessage(`${year - 1} has no ${kindLabels[kind]} names to copy.`)
      } else if (result.clonedCount === 0) {
        setSuccessMessage(
          `All names from ${year - 1} are already on the ${year} list.`,
        )
      } else {
        setSuccessMessage(
          `Copied ${result.clonedCount} name${result.clonedCount === 1 ? '' : 's'} from ${year - 1}.`,
        )
      }
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to clone plan names.',
      )
    },
  })

  const years = useMemo(() => yearOptions(year), [year])
  const previousYear = year - 1

  if (meQuery.isLoading) {
    return <SkeletonRows rows={6} />
  }

  if (meQuery.isError || !canManage) {
    return <Navigate to="/" replace />
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    if (!formName.trim()) {
      setErrorMessage('Plan name is required.')
      return
    }
    createMutation.mutate()
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return
    const name = editName.trim()
    if (!name) {
      setErrorMessage('Plan name is required.')
      return
    }
    updateMutation.mutate({ planNameId: editingId, name })
  }

  return (
    <div className="space-y-6">
      <Tabs
        tabs={tabs}
        activeTab={kind}
        onChange={(tabId) => {
          setKind(tabId as PlanNameKind)
          setEditingId(null)
          setErrorMessage(null)
          setSuccessMessage(null)
        }}
        ariaLabel="Plan name lists"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className={ui.text.mutedSm}>
            Names apply to a single year. Clone last year to start {year}, then add,
            rename, or remove entries.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2">
              <span className={ui.text.label}>Year</span>
              <select
                className={`${ui.field.control} w-full sm:w-auto`}
                value={year}
                onChange={(event) => {
                  setYear(Number(event.target.value))
                  setEditingId(null)
                  setSuccessMessage(null)
                }}
              >
                {years.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              loading={cloneMutation.isPending}
              onClick={() => {
                setErrorMessage(null)
                cloneMutation.mutate()
              }}
            >
              <Copy className="h-4 w-4" />
              Clone {previousYear}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setFormName('')
                setErrorMessage(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add name
            </Button>
          </div>
        </div>
      </Tabs>

      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      {errorMessage && !formOpen && !editingId ? (
        <p className={ui.text.errorBanner}>{errorMessage}</p>
      ) : null}

      {listQuery.isLoading ? (
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      ) : listQuery.isError ? (
        <Card>
          <EmptyState
            title="Unable to load plan names"
            description="Check that the API is running and that you can manage this organization."
          />
        </Card>
      ) : listQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${kindLabels[kind]} names for ${year}`}
            description={`Clone ${previousYear} to start this list, or add a name.`}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  loading={cloneMutation.isPending}
                  onClick={() => cloneMutation.mutate()}
                >
                  Clone {previousYear}
                </Button>
                <Button type="button" onClick={() => setFormOpen(true)}>
                  Add name
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {listQuery.data?.map((item) => (
              <li key={item.planNameId}>
                <PlanNameCard
                  item={item}
                  editing={editingId === item.planNameId}
                  editName={editName}
                  errorMessage={editingId === item.planNameId ? errorMessage : null}
                  saving={updateMutation.isPending}
                  onEditNameChange={setEditName}
                  onStartEdit={() => {
                    setEditingId(item.planNameId)
                    setEditName(item.name)
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={submitEdit}
                  onDelete={() => setDeleteTarget(item)}
                />
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className={ui.table.head}>
                  <tr>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={ui.table.body}>
                  {listQuery.data?.map((item) => (
                    <PlanNameRow
                      key={item.planNameId}
                      item={item}
                      editing={editingId === item.planNameId}
                      editName={editName}
                      errorMessage={editingId === item.planNameId ? errorMessage : null}
                      saving={updateMutation.isPending}
                      onEditNameChange={setEditName}
                      onStartEdit={() => {
                        setEditingId(item.planNameId)
                        setEditName(item.name)
                        setErrorMessage(null)
                        setSuccessMessage(null)
                      }}
                      onCancelEdit={() => setEditingId(null)}
                      onSaveEdit={submitEdit}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={formOpen}
        title={`Add ${kindLabels[kind]} name`}
        onClose={() => setFormOpen(false)}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}
          <Input
            label="Plan name"
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
            maxLength={200}
            required
          />
          <p className={ui.text.mutedSm}>Added to the {year} list.</p>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add name
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete plan name"
        description={`Remove "${deleteTarget?.name ?? 'this name'}" from the ${year} list? Enrollments that already use this name are not changed.`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.planNameId)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

interface PlanNameEditProps {
  item: PlanNameDto
  editing: boolean
  editName: string
  errorMessage: string | null
  saving: boolean
  onEditNameChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (event: FormEvent<HTMLFormElement>) => void
  onDelete: () => void
}

function PlanNameCard(props: PlanNameEditProps) {
  const { item, editing, editName, errorMessage, saving, onEditNameChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete } =
    props

  if (editing) {
    return (
      <article className={ui.surface.listCard}>
        <form className="space-y-3" onSubmit={onSaveEdit}>
          {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}
          <Input
            label="Plan name"
            value={editName}
            onChange={(event) => onEditNameChange(event.target.value)}
            maxLength={200}
            required
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className={ui.surface.listCard}>
      <p className={ui.text.itemTitle}>{item.name}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onStartEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </article>
  )
}

function PlanNameRow(props: PlanNameEditProps) {
  const { item, editing, editName, errorMessage, saving, onEditNameChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete } =
    props

  return (
    <tr className={ui.table.row}>
      <td className="px-3 py-3">
        {editing ? (
          <form className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={onSaveEdit}>
            <input
              className={ui.field.control}
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
              maxLength={200}
              aria-label="Plan name"
              required
            />
            {errorMessage ? (
              <span className={ui.text.error}>{errorMessage}</span>
            ) : null}
            <Button type="submit" loading={saving}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
          </form>
        ) : (
          <span className={ui.text.itemTitle}>{item.name}</span>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        {editing ? null : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onStartEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
