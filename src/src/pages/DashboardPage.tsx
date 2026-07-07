import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { listClients } from '@/api/clients'
import { listFollowUps } from '@/api/followUps'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatClientName, formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'

export function DashboardPage() {
  const activeClientsQuery = useQuery({
    queryKey: queryKeys.activeClientCount,
    queryFn: ({ signal }) =>
      listClients({ isActive: true, page: 1, pageSize: 1 }, { signal }),
  })

  const followUpsQuery = useQuery({
    queryKey: queryKeys.followUps,
    queryFn: ({ signal }) => listFollowUps({ signal }),
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${ui.text.muted}`}>Active clients</p>
              {activeClientsQuery.isLoading ? (
                <Skeleton className="mt-3 h-10 w-24" />
              ) : activeClientsQuery.isError ? (
                <p className="mt-3 text-3xl font-semibold text-slate-400">—</p>
              ) : (
                <p className={`mt-3 ${ui.text.stat}`}>
                  {activeClientsQuery.data?.totalCount ?? 0}
                </p>
              )}
              <p className={`mt-2 ${ui.text.mutedSm}`}>
                Clients currently marked active
              </p>
            </div>
            <div className={ui.surface.iconAccent}>
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Follow-ups"
        description="Interactions that still require follow-up"
      >
        {followUpsQuery.isLoading ? (
          <SkeletonRows rows={5} />
        ) : followUpsQuery.isError ? (
          <EmptyState
            title="Unable to load follow-ups"
            description="Check that the API is running and try again."
          />
        ) : followUpsQuery.data?.length === 0 ? (
          <EmptyState
            title="No follow-ups pending"
            description="You're caught up. New follow-ups will appear here."
          />
        ) : (
          <ul className={ui.divide.default}>
            {followUpsQuery.data?.map((followUp) => (
              <li
                key={followUp.clientInteractionId}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/clients/${followUp.clientId}`}
                      className={ui.link.item}
                    >
                      {formatClientName(
                        followUp.clientFirstName,
                        followUp.clientLastName,
                      )}
                    </Link>
                    <Badge variant="warning">Follow-up</Badge>
                  </div>
                  <p className={`mt-1 text-sm ${ui.text.secondary}`}>
                    {followUp.summary || 'No summary provided'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Contacted {formatDateTime(followUp.contactedAt)}
                  </p>
                </div>
                <Link
                  to={`/clients/${followUp.clientId}`}
                  className={ui.link.accentInline}
                >
                  View client
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
