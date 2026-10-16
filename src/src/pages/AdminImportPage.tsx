import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import {
  deleteImportMappingProfile,
  importAccessDatabase,
  listImportMappingProfiles,
  saveImportMappingProfile,
} from '@/api/imports'
import { ApiError } from '@/api/apiFetch'
import { ImportMappingCard } from '@/components/import/ImportMappingCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { summarizeAccessImport, type AccessImportPreview } from '@/lib/accessImport'
import {
  applyImportMapping,
  bestFittingProfile,
  overlaySavedProfile,
  suggestImportMapping,
  type ImportMappingProfile,
} from '@/lib/importMapping'
import { readWorkbookFile, WorkbookReadError, type SourceWorkbook } from '@/lib/workbook'
import { queryKeys } from '@/lib/queryKeys'
import { canManageOrganizationUsers } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'
import type { ImportMappingProfileDto } from '@/types/apiModels'

export function AdminImportPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState<SourceWorkbook | null>(null)
  const [draft, setDraft] = useState<ImportMappingProfile | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [stage, setStage] = useState<'map' | 'preview'>('map')
  const [parseError, setParseError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const canManage = canManageOrganizationUsers(meQuery.data?.role)
  const profilesQuery = useQuery({
    queryKey: queryKeys.importProfiles,
    queryFn: ({ signal }) => listImportMappingProfiles({ signal }),
    enabled: canManage,
  })

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
      clearFile()
    },
  })

  const saveMutation = useMutation({
    mutationFn: (profile: ImportMappingProfile) => saveImportMappingProfile(profile),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.importProfiles })
      setSelectedProfileId(saved.importMappingProfileId)
      setDraft(toProfile(saved))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (profileId: string) => deleteImportMappingProfile(profileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.importProfiles })
      setSelectedProfileId('')
    },
  })

  const preview = useMemo(() => {
    if (!workbook || !draft || stage !== 'preview') return null
    const payload = applyImportMapping(workbook, draft)
    return {
      fileName: workbook.fileName,
      payload,
      ...summarizeAccessImport(payload),
    }
  }, [workbook, draft, stage])

  if (meQuery.isSuccess && !canManage) {
    return <Navigate to="/" replace />
  }

  function clearFile() {
    setWorkbook(null)
    setDraft(null)
    setSelectedProfileId('')
    setStage('map')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setSuccessMessage(null)
    setParseError(null)
    setWorkbook(null)
    setDraft(null)
    setSelectedProfileId('')
    setStage('map')
    importMutation.reset()
    saveMutation.reset()
    if (!file) return

    setParsing(true)
    try {
      const loaded = await readWorkbookFile(file)
      let saved: ImportMappingProfileDto[] = profilesQuery.data ?? []
      if (!profilesQuery.data) {
        try {
          saved = await queryClient.fetchQuery({
            queryKey: queryKeys.importProfiles,
            queryFn: () => listImportMappingProfiles(),
          })
        } catch {
          saved = []
        }
      }
      const match = bestFittingProfile(loaded, saved.map(toProfileWithId))
      const suggestion = suggestImportMapping(loaded)
      const next = match?.profile ?? suggestion.profile
      setWorkbook(loaded)
      setDraft(next)
      setSelectedProfileId(match?.importMappingProfileId ?? '')
      setStage(match || suggestion.confidence === 'exact' ? 'preview' : 'map')
    } catch (error) {
      setParseError(
        error instanceof WorkbookReadError
          ? error.message
          : 'Unable to read this file. Use an Access database or an Excel .xlsx workbook.',
      )
    } finally {
      setParsing(false)
    }
  }

  function onSelectSaved(profileId: string) {
    setSelectedProfileId(profileId)
    if (!workbook) return
    if (!profileId) {
      setDraft(suggestImportMapping(workbook, { name: draft?.name }).profile)
      return
    }
    const saved = profilesQuery.data?.find((profile) => profile.importMappingProfileId === profileId)
    if (!saved) return
    setDraft(overlaySavedProfile(workbook, toProfile(saved)).profile)
  }

  const errorMessage =
    parseError ??
    (importMutation.error instanceof ApiError
      ? importMutation.error.message
      : importMutation.error
        ? 'Unable to import this file.'
        : null) ??
    (saveMutation.error instanceof ApiError
      ? saveMutation.error.message
      : saveMutation.error
        ? 'Unable to save this layout.'
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
        title="Broker file"
        description="Upload an Access database or Excel workbook. Matching runs in this browser. Only the mapped rows are uploaded, and a saved layout stores column names, not client data. Import is only allowed when this organization has no clients yet."
      >
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Broker workbook"
            accept=".accdb,.mdb,.xlsx,.xlsm,application/msaccess,application/x-msaccess,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-300 dark:file:bg-indigo-950/60 dark:file:text-indigo-200"
            onChange={(event) => void onFileChange(event)}
          />
          {parsing ? <p className={ui.text.mutedSm}>Reading file…</p> : null}
        </div>
      </Card>

      {workbook && draft && stage === 'map' ? (
        <Card title={workbook.fileName} description="Match the columns to BrokerBook, then review the counts.">
          <ImportMappingCard
            workbook={workbook}
            draft={draft}
            savedProfiles={profilesQuery.data ?? []}
            selectedProfileId={selectedProfileId}
            saving={saveMutation.isPending}
            onChange={setDraft}
            onSelectSaved={onSelectSaved}
            onSave={() => {
              const name = draft.name.trim()
              if (!name) return
              saveMutation.mutate({ ...draft, name })
            }}
            onReview={() => setStage('preview')}
          />
          {selectedProfileId ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="danger"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm('Delete this saved layout?')) {
                    deleteMutation.mutate(selectedProfileId)
                  }
                }}
              >
                Delete saved layout
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {preview && draft ? (
        <Card
          title={preview.fileName}
          description={
            selectedProfileId
              ? `Using the saved layout “${draft.name}”.`
              : 'Review these counts, then import into this organization.'
          }
        >
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
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {preview.clients > 0 ? (
              <Button
                type="button"
                loading={importMutation.isPending}
                onClick={() => importMutation.mutate(preview)}
              >
                <Upload className="h-4 w-4" />
                Import into this organization
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              disabled={importMutation.isPending}
              onClick={() => setStage('map')}
            >
              Edit mapping
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={importMutation.isPending}
              onClick={clearFile}
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : !parsing && !successMessage && !workbook ? (
        <Card>
          <EmptyState
            title="No file selected"
            description="Choose an Access database or Excel workbook to match columns and preview clients, plans, and contacts."
          />
        </Card>
      ) : null}
    </div>
  )
}

function toProfile(dto: ImportMappingProfileDto): ImportMappingProfile {
  return {
    name: dto.name,
    shape: dto.shape,
    tables: dto.tables,
    columns: dto.columns,
  }
}

function toProfileWithId(dto: ImportMappingProfileDto) {
  return { ...toProfile(dto), importMappingProfileId: dto.importMappingProfileId }
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
      <dt className={ui.text.detailLabel}>{label}</dt>
      <dd className={ui.text.detailValue}>{value}</dd>
    </div>
  )
}
