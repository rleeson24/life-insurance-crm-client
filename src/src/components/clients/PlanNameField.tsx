import { useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPlanName, lookupPlanNames } from '@/api/planNames'
import { ApiError } from '@/api/apiFetch'
import { Combobox } from '@/components/ui/Combobox'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  planNameOptionLabel,
  planYearsForCoverage,
  unknownPlanName,
} from '@/lib/planNames'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'
import type { PlanNameKind } from '@/types/apiModels'

interface PlanNameFieldProps {
  kind: PlanNameKind
  coverageStartDate: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function usePlanNameField({
  kind,
  coverageStartDate,
  label,
  value,
  onChange,
}: PlanNameFieldProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [unknownName, setUnknownName] = useState<string | null>(null)
  const [guardError, setGuardError] = useState<string | null>(null)
  const pendingSubmit = useRef<((event: FormEvent<HTMLFormElement>) => void) | null>(null)
  const pendingEvent = useRef<FormEvent<HTMLFormElement> | null>(null)

  const { catalogYear, priorYear } = planYearsForCoverage(coverageStartDate)

  const lookupQuery = useQuery({
    queryKey: queryKeys.planNameLookup(kind, priorYear, catalogYear),
    queryFn: ({ signal }) => lookupPlanNames(kind, priorYear, catalogYear, { signal }),
  })

  const options = useMemo(
    () =>
      (lookupQuery.data ?? []).map((item) => ({
        id: item.planNameId,
        label: planNameOptionLabel(item.name, item.planYear),
        value: item.name,
      })),
    [lookupQuery.data],
  )

  const addMutation = useMutation({
    mutationFn: (name: string) =>
      createPlanName(kind, { planYear: catalogYear, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-names'] })
      queryClient.invalidateQueries({ queryKey: ['plan-name-lookup'] })
    },
  })

  function field(): ReactNode {
    return (
      <Combobox
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        inputRef={inputRef}
        placeholder="Search or type a plan name"
      />
    )
  }

  function dialog(): ReactNode {
    if (typeof document === 'undefined' || unknownName === null) {
      return null
    }

    return createPortal(
      <Modal
        open
        title="Plan name is not in the list"
        onClose={() => {
          setUnknownName(null)
          setGuardError(null)
          pendingSubmit.current = null
          pendingEvent.current = null
        }}
      >
        <p className={ui.text.secondary}>
          “{unknownName}” is not in the {catalogYear} or {priorYear} list. Add it to{' '}
          {catalogYear}, or choose an existing name.
        </p>
        {guardError ? <p className={`mt-3 ${ui.text.errorBanner}`}>{guardError}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setUnknownName(null)
              setGuardError(null)
              pendingSubmit.current = null
              pendingEvent.current = null
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setUnknownName(null)
              setGuardError(null)
              pendingSubmit.current = null
              pendingEvent.current = null
              inputRef.current?.focus()
            }}
          >
            Choose an existing name
          </Button>
          <Button
            type="button"
            loading={addMutation.isPending}
            onClick={async () => {
              if (!unknownName || !pendingEvent.current || !pendingSubmit.current) return
              setGuardError(null)
              try {
                await addMutation.mutateAsync(unknownName)
              } catch (error) {
                if (!(error instanceof ApiError) || error.status !== 409) {
                  setGuardError(
                    error instanceof ApiError
                      ? error.message
                      : 'Unable to add this plan name.',
                  )
                  return
                }
              }
              onChange(unknownName)
              const submit = pendingSubmit.current
              const event = pendingEvent.current
              setUnknownName(null)
              pendingSubmit.current = null
              pendingEvent.current = null
              submit(event)
            }}
          >
            Add it and save
          </Button>
        </div>
      </Modal>,
      document.body,
    )
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    onProceed: (event: FormEvent<HTMLFormElement>) => void,
  ) {
    event.preventDefault()
    const catalog = lookupQuery.data
    if (catalog) {
      const unknown = unknownPlanName(value, catalog)
      if (unknown) {
        pendingSubmit.current = onProceed
        pendingEvent.current = event
        setUnknownName(unknown)
        setGuardError(null)
        return
      }
    }

    onProceed(event)
  }

  return { field, dialog, handleSubmit }
}
