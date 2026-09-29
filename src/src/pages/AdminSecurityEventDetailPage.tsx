import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getAuthSecurityEvent } from '@/api/authSecurityEvents'
import { getCurrentUser } from '@/api/me'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { isSuperAdmin } from '@/lib/roles'
import { formatSecurityEventType } from '@/lib/securityEvents'
import { ui } from '@/lib/uiClasses'
import type { AuthSecurityEventDto } from '@/types/apiModels'

export function AdminSecurityEventDetailPage() {
  const { eventId = '' } = useParams()
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const platformOperator = isSuperAdmin(meQuery.data?.role)
  const eventQuery = useQuery({
    queryKey: queryKeys.authSecurityEvent(eventId),
    queryFn: ({ signal }) => getAuthSecurityEvent(eventId, { signal }),
    enabled: platformOperator && Boolean(eventId),
  })

  if (meQuery.isLoading) {
    return <SkeletonRows rows={6} />
  }

  if (meQuery.isError || !platformOperator) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/security-events" className={ui.link.back}>
        <ArrowLeft className="h-4 w-4" />
        Security events
      </Link>

      {eventQuery.isLoading ? (
        <Card>
          <SkeletonRows rows={8} />
        </Card>
      ) : eventQuery.isError || !eventQuery.data ? (
        <Card>
          <EmptyState
            title="Security event not found"
            description="It may have been removed, or the link is no longer valid."
          />
        </Card>
      ) : (
        <SecurityEventDetails securityEvent={eventQuery.data} />
      )}
    </div>
  )
}

function SecurityEventDetails({ securityEvent }: { securityEvent: AuthSecurityEventDto }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-4 sm:px-5">
        <h2 className={ui.text.sectionTitle}>
          {formatSecurityEventType(securityEvent.eventType)}
        </h2>
        <Badge variant={securityEvent.success ? 'success' : 'warning'}>
          {securityEvent.success ? 'Succeeded' : 'Failed'}
        </Badge>
      </div>
      <dl className="grid gap-5 px-4 py-5 sm:grid-cols-2 sm:px-5">
        <Detail label="When" value={formatDateTime(securityEvent.occurredAt)} />
        <Detail label="User" value={securityEvent.userEmail || '—'} />
        <Detail label="User ID" value={securityEvent.userId || '—'} mono />
        <Detail
          label="Organization"
          value={securityEvent.tenantName?.trim() || '—'}
        />
        <Detail label="Tenant ID" value={securityEvent.tenantId || '—'} mono />
        <Detail label="IP address" value={securityEvent.ipAddress || '—'} />
        <Detail label="Resource" value={securityEvent.resource || '—'} />
        <Detail label="Correlation ID" value={securityEvent.correlationId || '—'} mono />
        <Detail label="Failure reason" value={securityEvent.failureReason || '—'} wide />
        <Detail label="User agent" value={securityEvent.userAgent || '—'} wide />
        <Detail label="Event ID" value={securityEvent.authSecurityEventId} mono wide />
      </dl>
    </Card>
  )
}

function Detail({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string
  value: string
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className={ui.text.detailLabel}>{label}</dt>
      <dd className={`${ui.text.detailValue} ${mono ? 'break-all font-mono text-xs' : 'break-words'}`}>
        {value}
      </dd>
    </div>
  )
}
