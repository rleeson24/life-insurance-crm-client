import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Clock, Phone, Plus, Search, Shield } from 'lucide-react'
import { listClients } from '@/api/clients'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatClientName, formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'
import type { ClientSummaryDto } from '@/types/apiModels'

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const queryParams = useMemo(
    () => ({ search: search.trim() || undefined, page, pageSize }),
    [search, page],
  )

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients(queryParams),
    queryFn: ({ signal }) => listClients(queryParams, { signal }),
    placeholderData: (previousData) => previousData,
  })

  const totalPages = clientsQuery.data
    ? Math.max(1, Math.ceil(clientsQuery.data.totalCount / pageSize))
    : 1

  const items = clientsQuery.data?.items ?? []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className={ui.feedback.searchIcon} />
          <Input
            aria-label="Search clients"
            className="pl-9"
            placeholder="Search by name, phone, or plan..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <Link to="/clients/new" className={`${ui.button.newClient} w-full justify-center sm:w-auto`}>
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </div>

      {clientsQuery.isLoading ? (
        <Card>
          <SkeletonRows rows={8} />
        </Card>
      ) : clientsQuery.isError ? (
        <Card>
          <EmptyState
            title="Unable to load clients"
            description="Check that the API is running and try again."
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No clients found"
            description={
              search
                ? 'Try a different search term.'
                : 'Create your first client to get started.'
            }
            action={
              <Link to="/clients/new" className={ui.button.secondary}>
                Create client
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {items.map((client) => (
              <li key={client.clientId}>
                <ClientCard client={client} />
              </li>
            ))}
          </ul>

          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className={ui.table.head}>
                  <tr>
                    <th className="px-3 py-3 font-medium">Client</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Plan</th>
                    <th className="px-3 py-3 font-medium">Last contact</th>
                  </tr>
                </thead>
                <tbody className={ui.table.body}>
                  {items.map((client) => (
                    <tr key={client.clientId} className={ui.table.row}>
                      <td className="px-3 py-3">
                        <Link
                          to={`/clients/${client.clientId}`}
                          className={ui.link.item}
                        >
                          {formatClientName(
                            client.firstName,
                            client.lastName,
                            client.legalName,
                          )}
                        </Link>
                        {client.isAcaClient ? (
                          <div className="mt-1">
                            <Badge variant="muted">ACA</Badge>
                          </div>
                        ) : null}
                      </td>
                      <td className={`px-3 py-3 ${ui.text.secondary}`}>
                        {client.primaryPhone || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={client.isActive ? 'success' : 'muted'}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className={`px-3 py-3 ${ui.text.secondary}`}>
                        {client.activePlanName || '—'}
                      </td>
                      <td className={`px-3 py-3 ${ui.text.secondary}`}>
                        {formatDateTime(client.lastContactedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              className={`mt-5 ${ui.table.footer}`}
              fetching={clientsQuery.isFetching}
              totalCount={clientsQuery.data?.totalCount ?? 0}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </Card>

          <Pagination
            className="md:hidden"
            fetching={clientsQuery.isFetching}
            totalCount={clientsQuery.data?.totalCount ?? 0}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: ClientSummaryDto }) {
  const name = formatClientName(client.firstName, client.lastName, client.legalName)

  return (
    <Link to={`/clients/${client.clientId}`} className={ui.surface.linkCard}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{name}</p>
            <Badge variant={client.isActive ? 'success' : 'muted'}>
              {client.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {client.isAcaClient ? <Badge variant="muted">ACA</Badge> : null}
          </div>
          <dl className="mt-3 space-y-1.5">
            <MetaRow icon={Phone} label="Phone">
              {client.primaryPhone || '—'}
            </MetaRow>
            <MetaRow icon={Shield} label="Plan">
              {client.activePlanName || 'No active plan'}
            </MetaRow>
            <MetaRow icon={Clock} label="Last contact">
              {formatDateTime(client.lastContactedAt)}
            </MetaRow>
          </dl>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      </div>
    </Link>
  )
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone
  label: string
  children: string
}) {
  return (
    <div className={`flex items-center gap-2 text-sm ${ui.text.secondary}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
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
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${className ?? ''}`}>
      <p className={ui.text.mutedSm}>
        {fetching ? 'Refreshing… ' : null}
        {totalCount} total clients
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
