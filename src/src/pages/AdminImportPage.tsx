import { useRef, useState, type ChangeEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import { importAccessDatabase } from '@/api/imports'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  AccessParseError,
  parseAccessDatabaseFile,
  type AccessImportPreview,
} from '@/lib/accessImport'
import { queryKeys } from '@/lib/queryKeys'
import { canManageOrganizationUsers } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'

export function AdminImportPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<AccessImportPreview | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const canManage = canManageOrganizationUsers(meQuery.data?.role)

  const importMutation = useMutation({
    mutationFn: (current: AccessImportPreview) =>
      importAccessDatabase({
        ...current.payload,
        timeZoneOffsetMinutes: new Date().getTimezoneOffset(),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeClientCount })
      queryClient.invalidateQueries({ queryKey: queryKeys.followUps })
      queryClient.invalidateQueries({ queryKey: ['plan-names'] })
      queryClient.invalidateQueries({ queryKey: ['plan-name-lookup'] })
      setSuccessMessage(
        `Imported ${result.clientsInserted} clients, ${result.majorMedicalEnrollmentsInserted} Medicare plans, ${result.drugPlanEnrollmentsInserted} drug plans, ${result.secondaryEnrollmentsInserted} secondary plans, ${result.interactionsInserted} contacts, and ${result.medicarePlanNamesInserted + result.drugPlanNamesInserted + result.secondaryPlanNamesInserted} unique plan names.`,
      )
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  if (meQuery.isSuccess && !canManage) {
    return <Navigate to="/" replace />
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setSuccessMessage(null)
    setParseError(null)
    setPreview(null)
    importMutation.reset()
    if (!file) {
      return
    }

    setParsing(true)
    try {
      setPreview(await parseAccessDatabaseFile(file))
    } catch (error) {
      setParseError(
        error instanceof AccessParseError
          ? error.message
          : 'Unable to read this Access file. Use a .accdb or .mdb in the Dustin table layout.',
      )
    } finally {
      setParsing(false)
    }
  }

  const errorMessage =
    parseError ??
    (importMutation.error instanceof ApiError
      ? importMutation.error.message
      : importMutation.error
        ? 'Unable to import this database.'
        : null)

  return (
    <div className="space-y-4 sm:space-y-6">
      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? <p className={ui.text.errorBanner}>{errorMessage}</p> : null}

      <Card
        title="Access database"
        description="Upload a Dustin-shaped .accdb or .mdb. Import is only allowed when this organization has no clients yet. Username and password columns are not sent."
      >
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".accdb,.mdb,application/msaccess,application/x-msaccess"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-300 dark:file:bg-indigo-950/60 dark:file:text-indigo-200"
            onChange={(event) => void onFileChange(event)}
          />
          {parsing ? <p className={ui.text.mutedSm}>Reading Access file…</p> : null}
        </div>
      </Card>

      {preview ? (
        <Card title={preview.fileName} description="Review these counts, then import into this organization.">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Count label="Clients" value={preview.clients} />
            <Count label="Medicare plans" value={preview.majorMedical} />
            <Count label="Drug plans" value={preview.drugPlans} />
            <Count label="Secondary plans" value={preview.secondary} />
            <Count label="Contacts" value={preview.contacts} />
            <Count label="Medicare names" value={preview.medicarePlanNames} />
            <Count label="Drug names" value={preview.drugPlanNames} />
            <Count label="Secondary names" value={preview.secondaryPlanNames} />
          </dl>

          {preview.warnings.length > 0 ? (
            <div className="mt-4">
              <p className={ui.text.mutedSm}>
                {preview.warnings.length} row{preview.warnings.length === 1 ? '' : 's'} will be skipped:
              </p>
              <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-slate-600 dark:text-slate-300">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.clients === 0 ? (
            <p className={`mt-4 ${ui.text.error}`}>
              No clients with a first and last name were found. Nothing will be imported.
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                loading={importMutation.isPending}
                disabled={preview.clients === 0}
                onClick={() => importMutation.mutate(preview)}
              >
                <Upload className="h-4 w-4" />
                Import into this organization
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={importMutation.isPending}
                onClick={() => {
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>
      ) : !parsing && !successMessage ? (
        <Card>
          <EmptyState
            title="No file selected"
            description="Choose the broker Access database to preview clients, plans, plan names, and contacts."
          />
        </Card>
      ) : null}
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
      <dt className={ui.text.detailLabel}>{label}</dt>
      <dd className={ui.text.detailValue}>{value}</dd>
    </div>
  )
}
