import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { deleteClient, getClientDetail, updateClient } from '@/api/clients'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ClientForm,
  clientFormFromDto,
  clientFormToPayload,
  type ClientFormValues,
} from '@/components/clients/ClientForm'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'

export function EditClientPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ClientFormValues | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const detailQuery = useQuery({
    queryKey: queryKeys.clientDetail(id),
    queryFn: () => getClientDetail(id),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (detailQuery.data?.client) {
      setForm(clientFormFromDto(detailQuery.data.client))
    }
  }, [detailQuery.data?.client])

  const updateMutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      updateClient(id, { ...clientFormToPayload(values), clientId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.clientDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeClientCount })
      navigate(`/clients/${id}`)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to update client.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeClientCount })
      navigate('/clients')
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to delete client.',
      )
      setShowDeleteConfirm(false)
    },
  })

  function updateField<K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    setErrorMessage(null)
    updateMutation.mutate(form)
  }

  const client = detailQuery.data?.client

  return (
    <div className="space-y-6">
      <Link to={`/clients/${id}`} className={ui.link.back}>
        <ArrowLeft className="h-4 w-4" />
        Back to client
      </Link>

      {detailQuery.isLoading || !form ? (
        <Card>
          <Skeleton className="h-8 w-48" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </Card>
      ) : detailQuery.isError || !client ? (
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
          <ClientForm
            form={form}
            onChange={updateField}
            onSubmit={handleSubmit}
            errorMessage={errorMessage}
            actions={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete client
                </Button>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/clients/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={updateMutation.isPending}>
                    Save changes
                  </Button>
                </div>
              </div>
            }
          />
        </Card>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete client"
        description="This will remove the client from your book of business. This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete client'}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
