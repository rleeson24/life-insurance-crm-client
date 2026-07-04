import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/api/clients'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ClientForm,
  clientFormToPayload,
  emptyClientForm,
  type ClientFormValues,
} from '@/components/clients/ClientForm'
import { queryKeys } from '@/lib/queryKeys'

export function NewClientPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ClientFormValues>(emptyClientForm)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeClientCount })
      navigate(`/clients/${client.clientId}`)
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Unable to create client.',
      )
    },
  })

  function updateField<K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    createMutation.mutate(clientFormToPayload(form))
  }

  return (
    <Card>
      <ClientForm
        form={form}
        onChange={updateField}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={createMutation.isPending}>
              Create client
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/clients')}
            >
              Cancel
            </Button>
          </div>
        }
      />
    </Card>
  )
}
