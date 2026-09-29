import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search } from 'lucide-react'
import { listAuthSecurityEvents } from '@/api/authSecurityEvents'
import { getCurrentUser } from '@/api/me'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { isSuperAdmin } from '@/lib/roles'
import { formatSecurityEventType, securityEventTypes } from '@/lib/securityEvents'
import { ui } from '@/lib/uiClasses'
import type { AuthSecurityEventDto } from '@/types/apiModels'

export function AdminSecurityEventsPage() {
  const [search, setSearch] = useState('')
  const [eventType, setEventType] = useState('')
  const [outcome, setOutcome] = useState<'all' | 'success' | 'failure'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const platformOperator = isSuperAdmin(meQuery.data?.role)

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      eventType: eventType || undefined,
      success: outcome === 'all' ? undefined : outcome === 'success',
      page,
      pageSize,
    }),
    [search, eventType, outcome, page],
  )

  const eventsQuery = useQuery({
    queryKey: queryKeys.authSecurityEvents(queryParams),
    queryFn: ({ signal }) => listAuthSecurityEvents(queryParams, { signal }),
    enabled: platformOperator,
    placeholderData: (previousData) => previousData,
  })

  if (meQuery.isLoading) {
    return <SkeletonRows rows={6} />
  }

  if (meQuery.isError || !platformOperator) {
    return <Navigate to="/" replace />
  }

  const totalPages = eventsQuery.data
    ? Math.max(1, Math.ceil(eventsQuery.data.totalCount / pageSize))
    : 1
  const items = eventsQuery.data?.items ?? []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_11rem]">
        <div className="relative">
          <Search className={ui.feedback.searchIcon} />
          <Input
            aria-label="Search security events"
            className="pl-9"
            placeholder="Search email, organization, resource..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className={ui.field.control}
          aria-label="Event type"
          value={eventType}
          onChange={(event) => {
            setEventType(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All event types</option>
          {securityEventTypes.map((type) => (
            <option key={type} value={type}>
              {formatSecurityEventType(type)}
            </option>
          ))}
        </select>
        <select
          className={ui.field.control}
          aria-label="Outcome"
          value={outcome}
          onChange={(event) => {
            setOutcome(event.target.value as 'all' | 'success' | 'failure')
            setPage(1)
          }}
        >
          <option value="all">All outcomes</option>
          <option value="success">Succeeded</option>
          <option value="failure">Failed</option>
        </select>
      </div>

      {eventsQuery.isLoading ? (
        <Card>
          <SkeletonRows rows={8} />
        </Card>
      ) : eventsQuery.isError ? (
        <Card>
          <EmptyState
            title="Unable to load security events"
            description="Check that the API is running and that you are a SuperAdmin."
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No security events"
            description={
              search || eventType || outcome !== 'all'
                ? 'Try a different search or filter.'
                : 'Events appear here as people sign in, get denied, or export reports.'
            }
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {items.map((securityEvent) => (
              <li key={securityEvent.authSecurityEventId}>
                <SecurityEventCard securityEvent={securityEvent} />
              </li>
            ))}
          </ul>
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className={ui.table.head}>
                  <tr>
                    <th className="px-3 py-3 font-medium">When</th>
                    <th className="px-3 py-3 font-medium">Event</th>
                    <th className="px-3 py-3 font-medium">Outcome</th>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Organization</th>
                    <th className="px-3 py-3 font-medium">Resource</th>
                  </tr>
                </thead>
                <tbody className={ui.table.body}>
                  {items.map((securityEvent) => (
                    <SecurityEventRow
                      key={securityEvent.authSecurityEventId}
                      securityEvent={securityEvent}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              className={`mt-5 ${ui.table.footer}`}
              fetching={eventsQuery.isFetching}
              totalCount={eventsQuery.data?.totalCount ?? 0}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </Card>
          <Pagination
            className="md:hidden"
            fetching={eventsQuery.isFetching}
            totalCount={eventsQuery.data?.totalCount ?? 0}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function SecurityEventCard({ securityEvent }: { securityEvent: AuthSecurityEventDto }) {
  return (
    <Link
      to={`/admin/security-events/${securityEvent.authSecurityEventId}`}
      className={ui.surface.linkCard}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={ui.text.itemTitle}>{formatSecurityEventType(securityEvent.eventType)}</p>
            <OutcomeBadge success={securityEvent.success} />
          </div>
          <p className={`mt-1 text-sm ${ui.text.secondary}`}>
            {formatDateTime(securityEvent.occurredAt)}
          </p>
          <p className={`mt-2 truncate text-sm ${ui.text.secondary}`}>
            {securityEvent.userEmail || 'Unknown user'}
            {' · '}
            {securityEvent.tenantName?.trim() || 'No organization'}
          </p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      </div>
    </Link>
  )
}

function SecurityEventRow({ securityEvent }: { securityEvent: AuthSecurityEventDto }) {
  return (
    <tr className={ui.table.row}>
      <td className="px-3 py-3">
        <Link
          to={`/admin/security-events/${securityEvent.authSecurityEventId}`}
          className={ui.link.item}
        >
          {formatDateTime(securityEvent.occurredAt)}
        </Link>
      </td>
      <td className={`px-3 py-3 ${ui.text.primary}`}>
        {formatSecurityEventType(securityEvent.eventType)}
      </td>
      <td className="px-3 py-3">
        <OutcomeBadge success={securityEvent.success} />
      </td>
      <td className={`px-3 py-3 ${ui.text.secondary}`}>
        {securityEvent.userEmail || '—'}
      </td>
      <td className={`px-3 py-3 ${ui.text.secondary}`}>
        {securityEvent.tenantName?.trim() || '—'}
      </td>
      <td className={`max-w-xs truncate px-3 py-3 ${ui.text.secondary}`}>
        {securityEvent.resource || '—'}
      </td>
    </tr>
  )
}

function OutcomeBadge({ success }: { success: boolean }) {
  return (
    <Badge variant={success ? 'success' : 'warning'}>
      {success ? 'Succeeded' : 'Failed'}
    </Badge>
  )
}

function Pagination({
  className,
  fetching,
  totalCount,
  page,
  totalPages,
  onPageChange,
}: {
  className?: string
  fetching: boolean
  totalCount: number
  page: number
  totalPages: number
  onPageChange: (page: number | ((current: number) => number)) => void
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <p className={ui.text.mutedSm}>
        {fetching ? 'Refreshing… ' : null}
        {totalCount} total events
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="flex-1 sm:flex-none"
          disabled={page <= 1 || fetching}
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <span className={`shrink-0 ${ui.text.mutedSm}`}>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          className="flex-1 sm:flex-none"
          disabled={page >= totalPages || fetching}
          onClick={() => onPageChange((current) => Math.min(totalPages, current + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
