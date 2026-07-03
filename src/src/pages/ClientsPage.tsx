import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { listClients } from '@/api/clients'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatClientName, formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'

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
    queryFn: () => listClients(queryParams),
    placeholderData: (previousData) => previousData,
  })

  const totalPages = clientsQuery.data
    ? Math.max(1, Math.ceil(clientsQuery.data.totalCount / pageSize))
    : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
        <Link
          to="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </div>

      <Card>
        {clientsQuery.isLoading ? (
          <SkeletonRows rows={8} />
        ) : clientsQuery.isError ? (
          <EmptyState
            title="Unable to load clients"
            description="Check that the API is running and try again."
          />
        ) : clientsQuery.data?.items.length === 0 ? (
          <EmptyState
            title="No clients found"
            description={
              search
                ? 'Try a different search term.'
                : 'Create your first client to get started.'
            }
            action={
              <Link
                to="/clients/new"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Create client
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Client</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Plan</th>
                    <th className="px-3 py-3 font-medium">Last contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientsQuery.data?.items.map((client) => (
                    <tr key={client.clientId} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Link
                          to={`/clients/${client.clientId}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
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
                      <td className="px-3 py-3 text-slate-600">
                        {client.primaryPhone || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={client.isActive ? 'success' : 'muted'}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {client.activePlanName || '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDateTime(client.lastContactedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                {clientsQuery.isFetching ? 'Refreshing… ' : null}
                {clientsQuery.data?.totalCount ?? 0} total clients
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || clientsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages || clientsQuery.isFetching}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
