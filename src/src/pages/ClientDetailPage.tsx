import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getClientDetail } from '@/api/clients'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { formatClientName, formatDate, formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'coverage', label: 'Coverage' },
]

function DetailField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  )
}

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const detailQuery = useQuery({
    queryKey: queryKeys.clientDetail(id),
    queryFn: () => getClientDetail(id),
    enabled: Boolean(id),
  })

  const client = detailQuery.data?.client
  const detail = detailQuery.data

  return (
    <div className="space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
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
            <Link
              to="/clients"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Return to clients
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
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
              detail.interactions.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Client interactions will appear here once logged."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {detail.interactions.map((interaction) => (
                    <li key={interaction.clientInteractionId} className="py-4 first:pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {interaction.summary || 'Interaction'}
                        </p>
                        {interaction.requiresFollowUp ? (
                          <Badge variant="warning">Follow-up</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {interaction.notes || 'No notes recorded'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDateTime(interaction.contactedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {activeTab === 'coverage' ? (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Medicare enrollments
                  </h3>
                  {detail.medicareEnrollments.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No Medicare enrollments recorded.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {detail.medicareEnrollments.map((enrollment) => (
                        <li key={enrollment.medicareEnrollmentId} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {enrollment.planName || 'Medicare plan'}
                            </p>
                            {enrollment.isActivePlan ? (
                              <Badge variant="success">Active</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            Start {formatDate(enrollment.coverageStartDate)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Supplemental coverage
                  </h3>
                  {detail.supplementalEnrollments.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No supplemental coverage recorded.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {detail.supplementalEnrollments.map((enrollment) => (
                        <li
                          key={enrollment.supplementalEnrollmentId}
                          className="px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {enrollment.planOrCarrierName || 'Supplemental plan'}
                            </p>
                            {enrollment.isActiveCoverage ? (
                              <Badge variant="success">Active</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            Start {formatDate(enrollment.coverageStartDate)}
                          </p>
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
    </div>
  )
}
