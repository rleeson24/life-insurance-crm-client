import type { ImportMappingProfile, ImportRole, ImportShape } from '@/lib/importMapping'
import {
  listIgnoredColumns,
  mappingSections,
  profileIsReady,
  suggestImportMapping,
  suggestRoleColumns,
} from '@/lib/importMapping'
import type { SourceWorkbook } from '@/lib/workbook'
import type { ImportMappingProfileDto } from '@/types/apiModels'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ui } from '@/lib/uiClasses'

const SHAPES: { id: ImportShape; label: string; detail: string }[] = [
  {
    id: 'normalized',
    label: 'Separate tables',
    detail: 'Clients, plans, and contacts are in different tables or sheets.',
  },
  {
    id: 'flat',
    label: 'One row per client',
    detail: 'Each row is a person. Plan names are columns on that row.',
  },
  {
    id: 'ledger',
    label: 'One row per coverage',
    detail: 'The client is repeated once for each plan.',
  },
]

interface ImportMappingCardProps {
  workbook: SourceWorkbook
  draft: ImportMappingProfile
  savedProfiles: ImportMappingProfileDto[]
  selectedProfileId: string
  saving: boolean
  onChange: (draft: ImportMappingProfile) => void
  onSelectSaved: (profileId: string) => void
  onSave: () => void
  onReview: () => void
}

export function ImportMappingCard({
  workbook,
  draft,
  savedProfiles,
  selectedProfileId,
  saving,
  onChange,
  onSelectSaved,
  onSave,
  onReview,
}: ImportMappingCardProps) {
  const ignored = listIgnoredColumns(workbook, draft)
  const ready = profileIsReady(draft)

  function setShape(shape: ImportShape) {
    onChange(suggestImportMapping(workbook, { shape, name: draft.name }).profile)
  }

  function setTable(role: ImportRole, tableName: string) {
    const section = mappingSections(draft.shape).find((item) => item.role === role)
    const table = workbook.tables.find((item) => item.name === tableName)
    onChange({
      ...draft,
      tables: { ...draft.tables, [role]: table?.name ?? null },
      columns: {
        ...draft.columns,
        [role]: table && section ? suggestRoleColumns(table, section.fields) : {},
      },
    })
  }

  function setColumn(role: ImportRole, fieldId: string, column: string) {
    const next = { ...draft.columns[role] }
    if (column) next[fieldId] = column
    else delete next[fieldId]
    onChange({ ...draft, columns: { ...draft.columns, [role]: next } })
  }

  return (
    <div className="space-y-5">
      {savedProfiles.length > 0 ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={ui.text.label}>Saved layout</span>
          <select
            className={ui.field.control}
            value={selectedProfileId}
            onChange={(event) => onSelectSaved(event.target.value)}
          >
            <option value="">Suggested from this file</option>
            {savedProfiles.map((profile) => (
              <option key={profile.importMappingProfileId} value={profile.importMappingProfileId}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={ui.text.label}>How the file is organized</span>
        <select
          className={ui.field.control}
          value={draft.shape}
          onChange={(event) => setShape(event.target.value as ImportShape)}
        >
          {SHAPES.map((shape) => (
            <option key={shape.id} value={shape.id}>
              {shape.label}
            </option>
          ))}
        </select>
        <span className={ui.text.mutedSm}>{SHAPES.find((shape) => shape.id === draft.shape)?.detail}</span>
      </label>

      {mappingSections(draft.shape).map((section) => {
        const tableName = draft.tables[section.role] ?? ''
        const table = workbook.tables.find((item) => item.name === tableName)
        const groups = [...new Set(section.fields.map((field) => field.group))]
        return (
          <section key={section.role} className={ui.surface.formSection}>
            <h3 className={`pt-3 ${ui.text.subsectionTitle}`}>{section.title}</h3>
            <label className="mt-3 flex flex-col gap-1.5 text-sm">
              <span className={ui.text.label}>{section.tableLabel}</span>
              <select
                className={ui.field.control}
                value={tableName}
                onChange={(event) => setTable(section.role, event.target.value)}
              >
                <option value="">Don't import</option>
                {workbook.tables.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.rows.length})
                  </option>
                ))}
              </select>
            </label>
            {table ? (
              <div className="mt-3 space-y-4">
                {groups.map((group) => (
                  <div key={group}>
                    <p className={ui.text.detailLabel}>{group}</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {section.fields.filter((field) => field.group === group).map((field) => (
                        <label key={field.id} className="flex flex-col gap-1.5 text-sm">
                          <span className={ui.text.label}>
                            {field.label}
                            {field.id === 'firstName' || field.id === 'lastName' ? ' *' : ''}
                          </span>
                          <select
                            className={ui.field.control}
                            value={draft.columns[section.role]?.[field.id] ?? ''}
                            onChange={(event) => setColumn(section.role, field.id, event.target.value)}
                          >
                            <option value="">Don't import</option>
                            {table.columns.map((column) => (
                              <option key={column} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}

      {workbook.strippedColumns.length > 0 ? (
        <p className={ui.text.mutedSm}>
          Username and password columns were dropped and will not be imported.
        </p>
      ) : null}
      {ignored.length > 0 ? (
        <p className={ui.text.mutedSm}>
          {ignored.length} column{ignored.length === 1 ? '' : 's'} will be left out
          {ignored.length <= 12
            ? `: ${ignored.map((item) => item.column).join(', ')}.`
            : '.'}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input
          label="Layout name"
          value={draft.name}
          maxLength={100}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        <Button type="button" variant="secondary" loading={saving} onClick={onSave}>
          Save layout
        </Button>
      </div>

      {ready ? null : (
        <p className={ui.text.error}>Map a first name and a last name before reviewing the import.</p>
      )}
        <Button type="button" disabled={!ready} onClick={onReview}>
          Review import
        </Button>
        <p className={ui.text.mutedSm}>
          Saving uses the layout name. A matching name replaces that layout. The layout stores column names only.
        </p>
    </div>
  )
}
