import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { getClientDetail } from '@/api/clients'
import {
  createClientInteraction,
  deleteClientInteraction,
  updateClientInteraction,
} from '@/api/clientInteractions'
import {
  createMedicareEnrollment,
  deleteMedicareEnrollment,
  updateMedicareEnrollment,
} from '@/api/medicareEnrollments'
import {
  createSupplementalEnrollment,
  deleteSupplementalEnrollment,
  updateSupplementalEnrollment,
} from '@/api/supplementalEnrollments'
import { ApiError } from '@/api/apiFetch'
import {
  ClientInteractionForm,
  clientInteractionFormEmpty,
  clientInteractionFormFromDto,
  clientInteractionFormToPayload,
  type ClientInteractionFormValues,
} from '@/components/clients/ClientInteractionForm'
import {
  MedicareEnrollmentForm,
  medicareEnrollmentFormEmpty,
  medicareEnrollmentFormFromDto,
  medicareEnrollmentFormToPayload,
  type MedicareEnrollmentFormValues,
} from '@/components/clients/MedicareEnrollmentForm'
import {
  SupplementalEnrollmentForm,
  supplementalEnrollmentFormEmpty,
  supplementalEnrollmentFormFromDto,
  supplementalEnrollmentFormToPayload,
  type SupplementalEnrollmentFormValues,
} from '@/components/clients/SupplementalEnrollmentForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { formatClientName, formatDate, formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'
import type {
  ClientInteractionDto,
  MedicareEnrollmentDto,
  SupplementalEnrollmentDto,
} from '@/types/apiModels'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'coverage', label: 'Coverage' },
]

type MedicareModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; enrollment: MedicareEnrollmentDto }

type SupplementalModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; enrollment: SupplementalEnrollmentDto }

type InteractionModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; interaction: ClientInteractionDto }

type DeleteTarget =
  | { type: 'medicare'; enrollmentId: string; label: string }
  | { type: 'supplemental'; enrollmentId: string; label: string }
  | { type: 'interaction'; interactionId: string; label: string }

function DetailField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <dt className={ui.text.detailLabel}>{label}</dt>
      <dd className={ui.text.detailValue}>{value || '—'}</dd>
    </div>
  )
}

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [medicareModal, setMedicareModal] = useState<MedicareModalState>({ mode: 'closed' })
  const [supplementalModal, setSupplementalModal] = useState<SupplementalModalState>({
    mode: 'closed',
  })
  const [medicareForm, setMedicareForm] = useState<MedicareEnrollmentFormValues>(
    medicareEnrollmentFormEmpty(),
  )
  const [supplementalForm, setSupplementalForm] = useState<SupplementalEnrollmentFormValues>(
    supplementalEnrollmentFormEmpty(),
  )
  const [interactionModal, setInteractionModal] = useState<InteractionModalState>({
    mode: 'closed',
  })
  const [interactionForm, setInteractionForm] = useState<ClientInteractionFormValues>(
    clientInteractionFormEmpty(),
  )
  const [medicareError, setMedicareError] = useState<string | null>(null)
  const [supplementalError, setSupplementalError] = useState<string | null>(null)
  const [interactionError, setInteractionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const detailQuery = useQuery({
    queryKey: queryKeys.clientDetail(id),
    queryFn: ({ signal }) => getClientDetail(id, { signal }),
    enabled: Boolean(id),
  })

  function invalidateDetail() {
    queryClient.invalidateQueries({ queryKey: queryKeys.clientDetail(id) })
    queryClient.invalidateQueries({ queryKey: ['clients'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.followUps })
  }

  const medicareSaveMutation = useMutation({
    mutationFn: async () => {
      const payload = medicareEnrollmentFormToPayload(medicareForm)
      if (medicareModal.mode === 'create') {
        return createMedicareEnrollment(id, payload)
      }
      if (medicareModal.mode === 'edit') {
        return updateMedicareEnrollment(
          id,
          medicareModal.enrollment.medicareEnrollmentId,
          payload,
        )
      }
      throw new Error('Invalid medicare modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setMedicareModal({ mode: 'closed' })
      setMedicareError(null)
    },
    onError: (error) => {
      setMedicareError(
        error instanceof ApiError ? error.message : 'Unable to save Medicare enrollment.',
      )
    },
  })

  const supplementalSaveMutation = useMutation({
    mutationFn: async () => {
      const payload = supplementalEnrollmentFormToPayload(supplementalForm)
      if (supplementalModal.mode === 'create') {
        return createSupplementalEnrollment(id, payload)
      }
      if (supplementalModal.mode === 'edit') {
        return updateSupplementalEnrollment(
          id,
          supplementalModal.enrollment.supplementalEnrollmentId,
          payload,
        )
      }
      throw new Error('Invalid supplemental modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setSupplementalModal({ mode: 'closed' })
      setSupplementalError(null)
    },
    onError: (error) => {
      setSupplementalError(
        error instanceof ApiError
          ? error.message
          : 'Unable to save supplemental enrollment.',
      )
    },
  })

  const interactionSaveMutation = useMutation({
    mutationFn: async () => {
      const payload = clientInteractionFormToPayload(interactionForm)
      if (interactionModal.mode === 'create') {
        return createClientInteraction(id, payload)
      }
      if (interactionModal.mode === 'edit') {
        return updateClientInteraction(
          id,
          interactionModal.interaction.clientInteractionId,
          payload,
        )
      }
      throw new Error('Invalid interaction modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setInteractionModal({ mode: 'closed' })
      setInteractionError(null)
    },
    onError: (error) => {
      setInteractionError(
        error instanceof ApiError ? error.message : 'Unable to save activity.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.type === 'medicare') {
        return deleteMedicareEnrollment(id, target.enrollmentId)
      }
      if (target.type === 'supplemental') {
        return deleteSupplementalEnrollment(id, target.enrollmentId)
      }
      return deleteClientInteraction(id, target.interactionId)
    },
    onSuccess: () => {
      invalidateDetail()
      setDeleteTarget(null)
    },
    onError: (error) => {
      setInteractionError(
        error instanceof ApiError ? error.message : 'Unable to delete record.',
      )
      setDeleteTarget(null)
    },
  })

  function openMedicareCreate() {
    setMedicareForm(medicareEnrollmentFormEmpty())
    setMedicareError(null)
    setMedicareModal({ mode: 'create' })
  }

  function openMedicareEdit(enrollment: MedicareEnrollmentDto) {
    setMedicareForm(medicareEnrollmentFormFromDto(enrollment))
    setMedicareError(null)
    setMedicareModal({ mode: 'edit', enrollment })
  }

  function openSupplementalCreate() {
    setSupplementalForm(supplementalEnrollmentFormEmpty())
    setSupplementalError(null)
    setSupplementalModal({ mode: 'create' })
  }

  function openSupplementalEdit(enrollment: SupplementalEnrollmentDto) {
    setSupplementalForm(supplementalEnrollmentFormFromDto(enrollment))
    setSupplementalError(null)
    setSupplementalModal({ mode: 'edit', enrollment })
  }

  function openInteractionCreate() {
    setInteractionForm(clientInteractionFormEmpty())
    setInteractionError(null)
    setInteractionModal({ mode: 'create' })
  }

  function openInteractionEdit(interaction: ClientInteractionDto) {
    setInteractionForm(clientInteractionFormFromDto(interaction))
    setInteractionError(null)
    setInteractionModal({ mode: 'edit', interaction })
  }

  function handleMedicareSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    medicareSaveMutation.mutate()
  }

  function handleSupplementalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    supplementalSaveMutation.mutate()
  }

  function handleInteractionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    interactionSaveMutation.mutate()
  }

  const client = detailQuery.data?.client
  const detail = detailQuery.data

  return (
    <div className="space-y-6">
      <Link to="/clients" className={ui.link.back}>
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      {detailQuery.isLoading ? (
        <Card>
          <Skeleton className="h-8 w-64" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="mt-6">
            <SkeletonRows rows={4} />
          </div>
        </Card>
      ) : detailQuery.isError || !client || !detail ? (
        <EmptyState
          title="Client not found"
          description="This client may have been removed or the link is invalid."
          action={
            <Link to="/clients" className={ui.link.accent}>
              Return to clients
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={ui.text.cardTitle}>
                {formatClientName(
                  client.firstName,
                  client.lastName,
                  client.legalName,
                )}
              </h2>
              <Badge variant={client.isActive ? 'success' : 'muted'}>
                {client.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {client.isAcaClient ? <Badge variant="muted">ACA</Badge> : null}
            </div>
            <Link to={`/clients/${id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Edit client
              </Button>
            </Link>
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            {activeTab === 'overview' ? (
              <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <DetailField label="Primary phone" value={client.primaryPhone} />
                <DetailField label="Email" value={client.emailAddress} />
                <DetailField label="Date of birth" value={formatDate(client.dateOfBirth)} />
                <DetailField
                  label="Address"
                  value={
                    [client.addressLine1, client.city, client.state, client.postalCode]
                      .filter(Boolean)
                      .join(', ') || undefined
                  }
                />
                <DetailField label="Medicare number" value={client.medicareNumber} />
                <DetailField
                  label="Part A effective"
                  value={formatDate(client.medicarePartAEffectiveDate)}
                />
                <DetailField
                  label="Part B effective"
                  value={formatDate(client.medicarePartBEffectiveDate)}
                />
                <DetailField label="Notes" value={client.notes} />
                <DetailField
                  label="Last updated"
                  value={formatDateTime(client.updatedAt)}
                />
              </dl>
            ) : null}

            {activeTab === 'activity' ? (
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className={ui.text.subsectionTitle}>Interactions</h3>
                  <Button variant="secondary" onClick={openInteractionCreate}>
                    <Plus className="h-4 w-4" />
                    Log activity
                  </Button>
                </div>
                {detail.interactions.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    description="Log calls, meetings, and notes for this client."
                    action={
                      <Button variant="secondary" onClick={openInteractionCreate}>
                        <Plus className="h-4 w-4" />
                        Log activity
                      </Button>
                    }
                  />
                ) : (
                  <ul className={ui.surface.borderedList}>
                    {detail.interactions.map((interaction) => (
                      <li
                        key={interaction.clientInteractionId}
                        className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={ui.text.itemTitle}>
                              {interaction.summary || 'Interaction'}
                            </p>
                            {interaction.requiresFollowUp ? (
                              <Badge variant="warning">Follow-up</Badge>
                            ) : null}
                          </div>
                          <p className={`mt-1 text-sm ${ui.text.secondary}`}>
                            {interaction.notes || 'No notes recorded'}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateTime(interaction.contactedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => openInteractionEdit(interaction)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'interaction',
                                interactionId: interaction.clientInteractionId,
                                label: interaction.summary || 'Interaction',
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {activeTab === 'coverage' ? (
              <div className="space-y-6">
                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={ui.text.subsectionTitle}>Medicare enrollments</h3>
                    <Button variant="secondary" onClick={openMedicareCreate}>
                      <Plus className="h-4 w-4" />
                      Add Medicare
                    </Button>
                  </div>
                  {detail.medicareEnrollments.length === 0 ? (
                    <p className={`mt-2 ${ui.text.mutedSm}`}>
                      No Medicare enrollments recorded.
                    </p>
                  ) : (
                    <ul className={`mt-3 ${ui.surface.borderedList}`}>
                      {detail.medicareEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.medicareEnrollmentId}
                          className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={ui.text.itemTitle}>
                                {enrollment.planName || 'Medicare plan'}
                              </p>
                              {enrollment.isActivePlan ? (
                                <Badge variant="success">Active</Badge>
                              ) : null}
                            </div>
                            <p className={`mt-1 text-sm ${ui.text.secondary}`}>
                              Start {formatDate(enrollment.coverageStartDate)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => openMedicareEdit(enrollment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'medicare',
                                  enrollmentId: enrollment.medicareEnrollmentId,
                                  label: enrollment.planName || 'Medicare plan',
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={ui.text.subsectionTitle}>Supplemental coverage</h3>
                    <Button variant="secondary" onClick={openSupplementalCreate}>
                      <Plus className="h-4 w-4" />
                      Add supplemental
                    </Button>
                  </div>
                  {detail.supplementalEnrollments.length === 0 ? (
                    <p className={`mt-2 ${ui.text.mutedSm}`}>
                      No supplemental coverage recorded.
                    </p>
                  ) : (
                    <ul className={`mt-3 ${ui.surface.borderedList}`}>
                      {detail.supplementalEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.supplementalEnrollmentId}
                          className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={ui.text.itemTitle}>
                                {enrollment.planOrCarrierName || 'Supplemental plan'}
                              </p>
                              {enrollment.isActiveCoverage ? (
                                <Badge variant="success">Active</Badge>
                              ) : null}
                            </div>
                            <p className={`mt-1 text-sm ${ui.text.secondary}`}>
                              Start {formatDate(enrollment.coverageStartDate)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => openSupplementalEdit(enrollment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'supplemental',
                                  enrollmentId: enrollment.supplementalEnrollmentId,
                                  label: enrollment.planOrCarrierName || 'Supplemental plan',
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : null}
          </Tabs>
        </Card>
      )}

      <Modal
        open={medicareModal.mode !== 'closed'}
        title={
          medicareModal.mode === 'edit'
            ? 'Edit Medicare enrollment'
            : 'Add Medicare enrollment'
        }
        onClose={() => setMedicareModal({ mode: 'closed' })}
        className="max-w-2xl"
      >
        <MedicareEnrollmentForm
          form={medicareForm}
          onChange={(key, value) =>
            setMedicareForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleMedicareSubmit}
          onCancel={() => setMedicareModal({ mode: 'closed' })}
          submitLabel={medicareModal.mode === 'edit' ? 'Save changes' : 'Add enrollment'}
          loading={medicareSaveMutation.isPending}
          errorMessage={medicareError}
        />
      </Modal>

      <Modal
        open={supplementalModal.mode !== 'closed'}
        title={
          supplementalModal.mode === 'edit'
            ? 'Edit supplemental enrollment'
            : 'Add supplemental enrollment'
        }
        onClose={() => setSupplementalModal({ mode: 'closed' })}
        className="max-w-xl"
      >
        <SupplementalEnrollmentForm
          form={supplementalForm}
          onChange={(key, value) =>
            setSupplementalForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleSupplementalSubmit}
          onCancel={() => setSupplementalModal({ mode: 'closed' })}
          submitLabel={
            supplementalModal.mode === 'edit' ? 'Save changes' : 'Add enrollment'
          }
          loading={supplementalSaveMutation.isPending}
          errorMessage={supplementalError}
        />
      </Modal>

      <Modal
        open={interactionModal.mode !== 'closed'}
        title={
          interactionModal.mode === 'edit' ? 'Edit activity' : 'Log activity'
        }
        onClose={() => setInteractionModal({ mode: 'closed' })}
        className="max-w-lg"
      >
        <ClientInteractionForm
          form={interactionForm}
          onChange={(key, value) =>
            setInteractionForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleInteractionSubmit}
          onCancel={() => setInteractionModal({ mode: 'closed' })}
          submitLabel={interactionModal.mode === 'edit' ? 'Save changes' : 'Log activity'}
          loading={interactionSaveMutation.isPending}
          errorMessage={interactionError}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.type === 'interaction' ? 'Delete activity' : 'Delete enrollment'
        }
        description={`Remove "${deleteTarget?.label ?? 'this record'}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
