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
  createMajorMedicalEnrollment,
  deleteMajorMedicalEnrollment,
  updateMajorMedicalEnrollment,
} from '@/api/majorMedicalEnrollments'
import {
  createDrugPlanEnrollment,
  deleteDrugPlanEnrollment,
  updateDrugPlanEnrollment,
} from '@/api/drugPlanEnrollments'
import {
  createSecondaryEnrollment,
  deleteSecondaryEnrollment,
  updateSecondaryEnrollment,
} from '@/api/secondaryEnrollments'
import { ApiError } from '@/api/apiFetch'
import {
  ClientInteractionForm,
  clientInteractionFormEmpty,
  clientInteractionFormFromDto,
  clientInteractionFormToPayload,
  type ClientInteractionFormValues,
} from '@/components/clients/ClientInteractionForm'
import {
  MajorMedicalEnrollmentForm,
  majorMedicalEnrollmentFormEmpty,
  majorMedicalEnrollmentFormFromDto,
  majorMedicalEnrollmentFormToPayload,
  type MajorMedicalEnrollmentFormValues,
} from '@/components/clients/MajorMedicalEnrollmentForm'
import {
  DrugPlanEnrollmentForm,
  drugPlanEnrollmentFormEmpty,
  drugPlanEnrollmentFormFromDto,
  drugPlanEnrollmentFormToPayload,
  type DrugPlanEnrollmentFormValues,
} from '@/components/clients/DrugPlanEnrollmentForm'
import {
  SecondaryEnrollmentForm,
  secondaryEnrollmentFormEmpty,
  secondaryEnrollmentFormFromDto,
  secondaryEnrollmentFormToPayload,
  type SecondaryEnrollmentFormValues,
} from '@/components/clients/SecondaryEnrollmentForm'
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
  DrugPlanEnrollmentDto,
  MajorMedicalEnrollmentDto,
  SecondaryEnrollmentDto,
} from '@/types/apiModels'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'coverage', label: 'Coverage' },
]

type MajorMedicalModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; enrollment: MajorMedicalEnrollmentDto }

type DrugPlanModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; enrollment: DrugPlanEnrollmentDto }

type SecondaryModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; enrollment: SecondaryEnrollmentDto }

type InteractionModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; interaction: ClientInteractionDto }

type DeleteTarget =
  | { type: 'majorMedical'; enrollmentId: string; label: string }
  | { type: 'drugPlan'; enrollmentId: string; label: string }
  | { type: 'secondary'; enrollmentId: string; label: string }
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

function EnrollmentBadges({
  isActive,
  isNewEnrollment,
  hasHra,
}: {
  isActive: boolean
  isNewEnrollment?: boolean
  hasHra?: boolean
}) {
  return (
    <>
      {isActive ? <Badge variant="success">Active</Badge> : null}
      {isNewEnrollment ? <Badge>New</Badge> : null}
    </>
  )
}

function EnrollmentCardFields({
  coverageStartDate,
  recordedAt,
  enrollmentPlatform,
  enrollmentLocation,
  notes,
}: {
  coverageStartDate?: string | null
  recordedAt: string
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
}) {
  const showPlatform = enrollmentPlatform !== undefined
  const showLocation = enrollmentLocation !== undefined

  return (
    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
      <DetailField label="Coverage start" value={formatDate(coverageStartDate)} />
      <DetailField label="Recorded" value={formatDateTime(recordedAt)} />
      {showPlatform ? (
        <DetailField label="Platform" value={enrollmentPlatform} />
      ) : null}
      {showLocation ? (
        <DetailField label="Location" value={enrollmentLocation} />
      ) : null}
      <div className="sm:col-span-2">
        <DetailField label="Notes" value={notes} />
      </div>
    </dl>
  )
}

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [majorMedicalModal, setMajorMedicalModal] = useState<MajorMedicalModalState>({
    mode: 'closed',
  })
  const [drugPlanModal, setDrugPlanModal] = useState<DrugPlanModalState>({ mode: 'closed' })
  const [secondaryModal, setSecondaryModal] = useState<SecondaryModalState>({
    mode: 'closed',
  })
  const [majorMedicalForm, setMajorMedicalForm] = useState<MajorMedicalEnrollmentFormValues>(
    majorMedicalEnrollmentFormEmpty(),
  )
  const [drugPlanForm, setDrugPlanForm] = useState<DrugPlanEnrollmentFormValues>(
    drugPlanEnrollmentFormEmpty(),
  )
  const [secondaryForm, setSecondaryForm] = useState<SecondaryEnrollmentFormValues>(
    secondaryEnrollmentFormEmpty(),
  )
  const [interactionModal, setInteractionModal] = useState<InteractionModalState>({
    mode: 'closed',
  })
  const [interactionForm, setInteractionForm] = useState<ClientInteractionFormValues>(
    clientInteractionFormEmpty(),
  )
  const [majorMedicalError, setMajorMedicalError] = useState<string | null>(null)
  const [drugPlanError, setDrugPlanError] = useState<string | null>(null)
  const [secondaryError, setSecondaryError] = useState<string | null>(null)
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

  const majorMedicalSaveMutation = useMutation({
    mutationFn: async () => {
      const payload = majorMedicalEnrollmentFormToPayload(majorMedicalForm)
      if (majorMedicalModal.mode === 'create') {
        return createMajorMedicalEnrollment(id, { ...payload, isActivePlan: true })
      }
      if (majorMedicalModal.mode === 'edit') {
        return updateMajorMedicalEnrollment(
          id,
          majorMedicalModal.enrollment.majorMedicalEnrollmentId,
          payload,
        )
      }
      throw new Error('Invalid major medical modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setMajorMedicalModal({ mode: 'closed' })
      setMajorMedicalError(null)
    },
    onError: (error) => {
      setMajorMedicalError(
        error instanceof ApiError ? error.message : 'Unable to save Major Medical enrollment.',
      )
    },
  })

  const drugPlanSaveMutation = useMutation({
    mutationFn: async () => {
      const payload = drugPlanEnrollmentFormToPayload(drugPlanForm)
      if (drugPlanModal.mode === 'create') {
        return createDrugPlanEnrollment(id, { ...payload, isActivePlan: true })
      }
      if (drugPlanModal.mode === 'edit') {
        return updateDrugPlanEnrollment(
          id,
          drugPlanModal.enrollment.drugPlanEnrollmentId,
          payload,
        )
      }
      throw new Error('Invalid drug plan modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setDrugPlanModal({ mode: 'closed' })
      setDrugPlanError(null)
    },
    onError: (error) => {
      setDrugPlanError(
        error instanceof ApiError ? error.message : 'Unable to save drug plan enrollment.',
      )
    },
  })

  const secondarySaveMutation = useMutation({
    mutationFn: async () => {
      const payload = secondaryEnrollmentFormToPayload(secondaryForm)
      if (secondaryModal.mode === 'create') {
        return createSecondaryEnrollment(id, { ...payload, isActiveCoverage: true })
      }
      if (secondaryModal.mode === 'edit') {
        return updateSecondaryEnrollment(
          id,
          secondaryModal.enrollment.secondaryEnrollmentId,
          payload,
        )
      }
      throw new Error('Invalid secondary modal state')
    },
    onSuccess: () => {
      invalidateDetail()
      setSecondaryModal({ mode: 'closed' })
      setSecondaryError(null)
    },
    onError: (error) => {
      setSecondaryError(
        error instanceof ApiError ? error.message : 'Unable to save secondary enrollment.',
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
      if (target.type === 'majorMedical') {
        return deleteMajorMedicalEnrollment(id, target.enrollmentId)
      }
      if (target.type === 'drugPlan') {
        return deleteDrugPlanEnrollment(id, target.enrollmentId)
      }
      if (target.type === 'secondary') {
        return deleteSecondaryEnrollment(id, target.enrollmentId)
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

  function openMajorMedicalCreate() {
    setMajorMedicalForm(majorMedicalEnrollmentFormEmpty())
    setMajorMedicalError(null)
    setMajorMedicalModal({ mode: 'create' })
  }

  function openMajorMedicalEdit(enrollment: MajorMedicalEnrollmentDto) {
    setMajorMedicalForm(majorMedicalEnrollmentFormFromDto(enrollment))
    setMajorMedicalError(null)
    setMajorMedicalModal({ mode: 'edit', enrollment })
  }

  function openDrugPlanCreate() {
    setDrugPlanForm(drugPlanEnrollmentFormEmpty())
    setDrugPlanError(null)
    setDrugPlanModal({ mode: 'create' })
  }

  function openDrugPlanEdit(enrollment: DrugPlanEnrollmentDto) {
    setDrugPlanForm(drugPlanEnrollmentFormFromDto(enrollment))
    setDrugPlanError(null)
    setDrugPlanModal({ mode: 'edit', enrollment })
  }

  function openSecondaryCreate() {
    setSecondaryForm(secondaryEnrollmentFormEmpty())
    setSecondaryError(null)
    setSecondaryModal({ mode: 'create' })
  }

  function openSecondaryEdit(enrollment: SecondaryEnrollmentDto) {
    setSecondaryForm(secondaryEnrollmentFormFromDto(enrollment))
    setSecondaryError(null)
    setSecondaryModal({ mode: 'edit', enrollment })
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

  function handleMajorMedicalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    majorMedicalSaveMutation.mutate()
  }

  function handleDrugPlanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    drugPlanSaveMutation.mutate()
  }

  function handleSecondarySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    secondarySaveMutation.mutate()
  }

  function handleInteractionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    interactionSaveMutation.mutate()
  }

  const client = detailQuery.data?.client
  const detail = detailQuery.data

  return (
    <div className="space-y-4 sm:space-y-6">
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
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h2 className={`${ui.text.cardTitle} break-words`}>
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
            <Link to={`/clients/${id}/edit`} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Pencil className="h-4 w-4" />
                Edit client
              </Button>
            </Link>
          </div>

          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            ariaLabel="Client profile sections"
          >
            {activeTab === 'overview' ? (
              <dl className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <h3 className={ui.text.subsectionTitle}>Interactions</h3>
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={openInteractionCreate}>
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
                        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
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
                            className="flex-1 sm:flex-none"
                            onClick={() => openInteractionEdit(interaction)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="flex-1 sm:flex-none"
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h3 className={ui.text.subsectionTitle}>Major Medical enrollments</h3>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={openMajorMedicalCreate}>
                      <Plus className="h-4 w-4" />
                      Add Major Medical
                    </Button>
                  </div>
                  {detail.majorMedicalEnrollments.length === 0 ? (
                    <p className={`mt-2 ${ui.text.mutedSm}`}>
                      No Major Medical enrollments recorded.
                    </p>
                  ) : (
                    <ul className={`mt-3 divide-y ${ui.surface.borderedList}`}>
                      {detail.majorMedicalEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.majorMedicalEnrollmentId}
                          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={ui.text.itemTitle}>
                                {enrollment.planName || 'Major Medical plan'}
                              </p>
                              <EnrollmentBadges
                                isActive={enrollment.isActivePlan}
                                isNewEnrollment={enrollment.isNewEnrollment}
                                hasHra={enrollment.healthReimbursementArrangement}
                              />
                            </div>
                            <EnrollmentCardFields
                              coverageStartDate={enrollment.coverageStartDate}
                              recordedAt={enrollment.recordedAt}
                              enrollmentPlatform={enrollment.enrollmentPlatform}
                              enrollmentLocation={enrollment.enrollmentLocation}
                              notes={enrollment.notes}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() => openMajorMedicalEdit(enrollment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'majorMedical',
                                  enrollmentId: enrollment.majorMedicalEnrollmentId,
                                  label: enrollment.planName || 'Major Medical plan',
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h3 className={ui.text.subsectionTitle}>Drug plan enrollments</h3>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={openDrugPlanCreate}>
                      <Plus className="h-4 w-4" />
                      Add drug plan
                    </Button>
                  </div>
                  {detail.drugPlanEnrollments.length === 0 ? (
                    <p className={`mt-2 ${ui.text.mutedSm}`}>
                      No drug plan enrollments recorded.
                    </p>
                  ) : (
                    <ul className={`mt-3 divide-y ${ui.surface.borderedList}`}>
                      {detail.drugPlanEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.drugPlanEnrollmentId}
                          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={ui.text.itemTitle}>
                                {enrollment.planName || 'Drug plan'}
                              </p>
                              <EnrollmentBadges
                                isActive={enrollment.isActivePlan}
                                isNewEnrollment={enrollment.isNewEnrollment}
                                hasHra={enrollment.healthReimbursementArrangement}
                              />
                            </div>
                            <EnrollmentCardFields
                              coverageStartDate={enrollment.coverageStartDate}
                              recordedAt={enrollment.recordedAt}
                              enrollmentPlatform={enrollment.enrollmentPlatform}
                              enrollmentLocation={enrollment.enrollmentLocation}
                              notes={enrollment.notes}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() => openDrugPlanEdit(enrollment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'drugPlan',
                                  enrollmentId: enrollment.drugPlanEnrollmentId,
                                  label: enrollment.planName || 'Drug plan',
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h3 className={ui.text.subsectionTitle}>Secondary enrollments</h3>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={openSecondaryCreate}>
                      <Plus className="h-4 w-4" />
                      Add secondary
                    </Button>
                  </div>
                  {detail.secondaryEnrollments.length === 0 ? (
                    <p className={`mt-2 ${ui.text.mutedSm}`}>
                      No secondary enrollments recorded.
                    </p>
                  ) : (
                    <ul className={`mt-3 divide-y ${ui.surface.borderedList}`}>
                      {detail.secondaryEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.secondaryEnrollmentId}
                          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={ui.text.itemTitle}>
                                {enrollment.planOrCarrierName || 'Secondary plan'}
                              </p>
                              <EnrollmentBadges isActive={enrollment.isActiveCoverage} />
                            </div>
                            <EnrollmentCardFields
                              coverageStartDate={enrollment.coverageStartDate}
                              recordedAt={enrollment.recordedAt}
                              notes={enrollment.notes}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() => openSecondaryEdit(enrollment)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="flex-1 sm:flex-none"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'secondary',
                                  enrollmentId: enrollment.secondaryEnrollmentId,
                                  label: enrollment.planOrCarrierName || 'Secondary plan',
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
        open={majorMedicalModal.mode !== 'closed'}
        title={
          majorMedicalModal.mode === 'edit'
            ? 'Edit Major Medical enrollment'
            : 'Add Major Medical enrollment'
        }
        onClose={() => setMajorMedicalModal({ mode: 'closed' })}
        className="max-w-2xl"
      >
        <MajorMedicalEnrollmentForm
          form={majorMedicalForm}
          onChange={(key, value) =>
            setMajorMedicalForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleMajorMedicalSubmit}
          onCancel={() => setMajorMedicalModal({ mode: 'closed' })}
          submitLabel={majorMedicalModal.mode === 'edit' ? 'Save changes' : 'Add enrollment'}
          loading={majorMedicalSaveMutation.isPending}
          errorMessage={majorMedicalError}
          showActive={majorMedicalModal.mode === 'edit'}
        />
      </Modal>

      <Modal
        open={drugPlanModal.mode !== 'closed'}
        title={
          drugPlanModal.mode === 'edit'
            ? 'Edit drug plan enrollment'
            : 'Add drug plan enrollment'
        }
        onClose={() => setDrugPlanModal({ mode: 'closed' })}
        className="max-w-2xl"
      >
        <DrugPlanEnrollmentForm
          form={drugPlanForm}
          onChange={(key, value) =>
            setDrugPlanForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleDrugPlanSubmit}
          onCancel={() => setDrugPlanModal({ mode: 'closed' })}
          submitLabel={drugPlanModal.mode === 'edit' ? 'Save changes' : 'Add enrollment'}
          loading={drugPlanSaveMutation.isPending}
          errorMessage={drugPlanError}
          showActive={drugPlanModal.mode === 'edit'}
        />
      </Modal>

      <Modal
        open={secondaryModal.mode !== 'closed'}
        title={
          secondaryModal.mode === 'edit'
            ? 'Edit secondary enrollment'
            : 'Add secondary enrollment'
        }
        onClose={() => setSecondaryModal({ mode: 'closed' })}
        className="max-w-xl"
      >
        <SecondaryEnrollmentForm
          form={secondaryForm}
          onChange={(key, value) =>
            setSecondaryForm((current) => ({ ...current, [key]: value }))
          }
          onSubmit={handleSecondarySubmit}
          onCancel={() => setSecondaryModal({ mode: 'closed' })}
          submitLabel={
            secondaryModal.mode === 'edit' ? 'Save changes' : 'Add enrollment'
          }
          loading={secondarySaveMutation.isPending}
          errorMessage={secondaryError}
          showActive={secondaryModal.mode === 'edit'}
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
