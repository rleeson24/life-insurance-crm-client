import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/api/clients'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { CreateClientModel } from '@/types/apiModels'
import { queryKeys } from '@/lib/queryKeys'

const initialFormState: CreateClientModel = {
  firstName: '',
  lastName: '',
  primaryPhone: '',
  emailAddress: '',
  city: '',
  state: '',
  isActive: true,
  isAcaClient: false,
  hasContactConsent: false,
  notes: '',
}

export function NewClientPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateClientModel>(initialFormState)
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

  function updateField<K extends keyof CreateClientModel>(
    key: K,
    value: CreateClientModel[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    createMutation.mutate(form)
  }

  return (
    <Card>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName ?? ''}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
          <Input
            label="Last name"
            value={form.lastName ?? ''}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
          <Input
            label="Primary phone"
            value={form.primaryPhone ?? ''}
            onChange={(event) => updateField('primaryPhone', event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.emailAddress ?? ''}
            onChange={(event) => updateField('emailAddress', event.target.value)}
          />
          <Input
            label="City"
            value={form.city ?? ''}
            onChange={(event) => updateField('city', event.target.value)}
          />
          <Input
            label="State"
            value={form.state ?? ''}
            onChange={(event) => updateField('state', event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(event) => updateField('isActive', event.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-indigo-400"
            />
            Active client
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isAcaClient ?? false}
              onChange={(event) => updateField('isAcaClient', event.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-indigo-400"
            />
            ACA client
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.hasContactConsent ?? false}
              onChange={(event) =>
                updateField('hasContactConsent', event.target.checked)
              }
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-indigo-400"
            />
            Contact consent on file
          </label>
        </div>

        <Textarea
          label="Notes"
          value={form.notes ?? ''}
          onChange={(event) => updateField('notes', event.target.value)}
        />

        {errorMessage ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {errorMessage}
          </p>
        ) : null}

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
      </form>
    </Card>
  )
}
