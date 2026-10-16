import type { AccessImportModel, AccessRow } from '@/types/apiModels'
import type { SourceTable, SourceWorkbook } from '@/lib/workbook'

export const IMPORT_SHAPES = ['normalized', 'flat', 'ledger'] as const
export type ImportShape = (typeof IMPORT_SHAPES)[number]

export const IMPORT_ROLES = [
  'clients',
  'medEnrollments',
  'otherEnrollments',
  'contacts',
  'rows',
] as const
export type ImportRole = (typeof IMPORT_ROLES)[number]

export interface TargetField {
  id: string
  label: string
  group: string
  canonical: string | null
  synonyms: string[]
  hint?: 'email' | 'state' | 'postal' | 'phone' | 'date' | 'bool' | 'medicare'
}

export interface ImportMappingProfile {
  name: string
  shape: ImportShape
  tables: Record<ImportRole, string | null>
  columns: Record<ImportRole, Record<string, string>>
}

export interface MappingSuggestion {
  profile: ImportMappingProfile
  confidence: 'exact' | 'suggested'
}

export interface MappingSection {
  role: ImportRole
  title: string
  tableLabel: string
  fields: TargetField[]
}

const DUSTIN_TABLES = {
  clients: 'ClientsT',
  medEnrollments: 'MEDEnrollmentT',
  otherEnrollments: 'OtherEnrollmentT',
  contacts: '_contactT',
} as const

const CLIENT_FIELDS: TargetField[] = [
  { id: 'clientId', label: 'Client id', group: 'Client', canonical: 'ClientID', synonyms: ['client id', 'clientid', 'member id', 'member number'] },
  { id: 'firstName', label: 'First name', group: 'Client', canonical: 'First', synonyms: ['first', 'first name', 'firstname', 'fname', 'given name'] },
  { id: 'lastName', label: 'Last name', group: 'Client', canonical: 'Last', synonyms: ['last', 'last name', 'lastname', 'lname', 'surname'] },
  { id: 'legalName', label: 'Legal name', group: 'Client', canonical: '*RealName', synonyms: ['real name', 'realname', 'legal name', 'legalname'] },
  { id: 'householdName', label: 'Household', group: 'Client', canonical: 'HouseholdName', synonyms: ['household', 'household name', 'householdname'] },
  { id: 'phone', label: 'Phone', group: 'Client', canonical: 'Phone#', synonyms: ['phone', 'phone number', 'primary phone', 'cell', 'mobile'], hint: 'phone' },
  { id: 'address1', label: 'Address', group: 'Client', canonical: 'Address', synonyms: ['address', 'address 1', 'address1', 'street', 'address line 1'] },
  { id: 'address2', label: 'Address line 2', group: 'Client', canonical: 'Address2', synonyms: ['address 2', 'address2', 'address line 2', 'apt', 'suite'] },
  { id: 'city', label: 'City', group: 'Client', canonical: 'City', synonyms: ['city'] },
  { id: 'state', label: 'State', group: 'Client', canonical: 'State', synonyms: ['state'], hint: 'state' },
  { id: 'postalCode', label: 'Postal code', group: 'Client', canonical: 'Zip', synonyms: ['zip', 'zip code', 'postal code', 'postalcode'], hint: 'postal' },
  { id: 'email', label: 'Email', group: 'Client', canonical: 'Email', synonyms: ['email', 'e-mail', 'email address'], hint: 'email' },
  { id: 'dateOfBirth', label: 'Date of birth', group: 'Client', canonical: 'DOB', synonyms: ['dob', 'date of birth', 'birth date', 'birthdate'], hint: 'date' },
  { id: 'medicareNumber', label: 'Medicare number', group: 'Client', canonical: 'Med#', synonyms: ['med#', 'med', 'mbi', 'medicare number', 'medicare id', 'hicn'], hint: 'medicare' },
  { id: 'partA', label: 'Part A effective', group: 'Client', canonical: 'A', synonyms: ['part a', 'medicare part a', 'part a effective', 'part a date', 'a'], hint: 'date' },
  { id: 'partB', label: 'Part B effective', group: 'Client', canonical: 'B', synonyms: ['part b', 'medicare part b', 'part b effective', 'part b date', 'b'], hint: 'date' },
  { id: 'isActive', label: 'Client is active', group: 'Client', canonical: 'IsActive', synonyms: ['is active', 'isactive', 'client active'], hint: 'bool' },
  { id: 'aca', label: 'ACA', group: 'Client', canonical: 'ACA', synonyms: ['aca'], hint: 'bool' },
  { id: 'permission', label: 'Contact consent', group: 'Client', canonical: 'Permission', synonyms: ['permission', 'consent', 'contact consent', 'ok to contact'], hint: 'bool' },
  { id: 'clientNotes', label: 'Client notes', group: 'Client', canonical: 'Description', synonyms: ['description', 'client notes', 'comments'] },
]

const MED_FIELDS: TargetField[] = [
  { id: 'medPlan', label: 'Medicare plan', group: 'Medicare', canonical: 'Enrollments', synonyms: ['enrollments', 'medicare plan', 'mapd', 'medical plan', 'advantage plan'] },
  { id: 'drugPlan', label: 'Drug plan', group: 'Drug plan', canonical: 'RX Card', synonyms: ['rx card', 'rxcard', 'drug plan', 'pdp', 'part d', 'prescription plan'] },
  { id: 'medStart', label: 'Coverage start', group: 'Medicare', canonical: 'StartDate', synonyms: ['start date', 'startdate', 'coverage start', 'effective date'], hint: 'date' },
  { id: 'medDate', label: 'Recorded date', group: 'Medicare', canonical: 'Date', synonyms: ['date', 'recorded date', 'enrollment date', 'signup date'], hint: 'date' },
  { id: 'medTime', label: 'Recorded time', group: 'Medicare', canonical: 'Time', synonyms: ['time'] },
  { id: 'medActive', label: 'Active plan', group: 'Medicare', canonical: 'ActivePlan', synonyms: ['active plan', 'activeplan', 'active'], hint: 'bool' },
  { id: 'medNew', label: 'New enrollment', group: 'Medicare', canonical: 'NEW', synonyms: ['new', 'new enrollment'], hint: 'bool' },
  { id: 'medHra', label: 'HRA', group: 'Medicare', canonical: 'HRA', synonyms: ['hra'], hint: 'bool' },
  { id: 'medPlatform', label: 'Platform', group: 'Medicare', canonical: 'Platform', synonyms: ['platform'] },
  { id: 'medLocation', label: 'Location', group: 'Medicare', canonical: 'Store', synonyms: ['store', 'location', 'enrollment location'] },
  { id: 'medNotes', label: 'Enrollment notes', group: 'Medicare', canonical: 'Notes', synonyms: ['notes', 'enrollment notes'] },
]

const SECONDARY_FIELDS: TargetField[] = [
  { id: 'secondaryPlan', label: 'Secondary plan', group: 'Secondary', canonical: 'Other Insurance', synonyms: ['other insurance', 'otherinsurance', 'secondary plan', 'secondary', 'supplemental', 'dental plan'] },
  { id: 'secondaryStart', label: 'Secondary start', group: 'Secondary', canonical: 'Start Date', synonyms: ['start date', 'startdate', 'coverage start', 'effective date'], hint: 'date' },
  { id: 'secondaryDate', label: 'Secondary recorded date', group: 'Secondary', canonical: 'Date', synonyms: ['date', 'recorded date'], hint: 'date' },
  { id: 'secondaryActive', label: 'Secondary is active', group: 'Secondary', canonical: 'IsActive', synonyms: ['is active', 'isactive', 'active'], hint: 'bool' },
  { id: 'secondaryNotes', label: 'Secondary notes', group: 'Secondary', canonical: 'Notes', synonyms: ['notes'] },
]

const CONTACT_FIELDS: TargetField[] = [
  { id: 'contactDate', label: 'Contact date', group: 'Contact', canonical: 'ContactDate', synonyms: ['contact date', 'contactdate', 'contacted'], hint: 'date' },
  { id: 'contactSummary', label: 'Contact summary', group: 'Contact', canonical: 'Description', synonyms: ['description', 'summary', 'subject'] },
  { id: 'contactNotes', label: 'Contact notes', group: 'Contact', canonical: 'Notes', synonyms: ['notes'] },
  { id: 'contactFollowUp', label: 'Follow-up', group: 'Contact', canonical: 'Followup', synonyms: ['followup', 'follow up', 'follow-up'], hint: 'bool' },
]

const LEDGER_FIELDS: TargetField[] = [
  { id: 'coverageKind', label: 'Coverage type', group: 'Coverage', canonical: null, synonyms: ['coverage type', 'plan type', 'product type', 'line of business', 'kind', 'type'] },
  { id: 'planName', label: 'Plan name', group: 'Coverage', canonical: null, synonyms: ['plan name', 'planname', 'plan', 'product', 'coverage'] },
]

const FIELD_BY_ID = new Map<string, TargetField>(
  [...CLIENT_FIELDS, ...MED_FIELDS, ...SECONDARY_FIELDS, ...CONTACT_FIELDS, ...LEDGER_FIELDS].map(
    (field) => [field.id, field],
  ),
)

const CLIENT_FIELD_IDS = CLIENT_FIELDS.map((field) => field.id)
const MED_OUTPUT_IDS = MED_FIELDS.map((field) => field.id)
const SECONDARY_OUTPUT_IDS = SECONDARY_FIELDS.map((field) => field.id)
const CONTACT_OUTPUT_IDS = CONTACT_FIELDS.map((field) => field.id)

function linkField(group: string): TargetField {
  return { ...CLIENT_FIELDS[0], group }
}

export function mappingSections(shape: ImportShape): MappingSection[] {
  if (shape === 'normalized') {
    return [
      { role: 'clients', title: 'Clients', tableLabel: 'Client table', fields: CLIENT_FIELDS },
      { role: 'medEnrollments', title: 'Medicare and drug plans', tableLabel: 'Medicare table', fields: [linkField('Medicare'), ...MED_FIELDS] },
      { role: 'otherEnrollments', title: 'Secondary coverage', tableLabel: 'Secondary table', fields: [linkField('Secondary'), ...SECONDARY_FIELDS] },
      { role: 'contacts', title: 'Contacts', tableLabel: 'Contact table', fields: [linkField('Contact'), ...CONTACT_FIELDS] },
    ]
  }

  const fields = shape === 'ledger'
    ? [...LEDGER_FIELDS, ...CLIENT_FIELDS, ...MED_FIELDS, ...SECONDARY_FIELDS, ...CONTACT_FIELDS]
    : [...CLIENT_FIELDS, ...MED_FIELDS, ...SECONDARY_FIELDS, ...CONTACT_FIELDS]

  return [{
    role: 'rows',
    title: shape === 'ledger' ? 'One row per coverage' : 'One row per client',
    tableLabel: 'Sheet or table',
    fields,
  }]
}

export function clientRole(shape: ImportShape): ImportRole {
  return shape === 'normalized' ? 'clients' : 'rows'
}

export function profileIsReady(profile: ImportMappingProfile): boolean {
  const columns = profile.columns[clientRole(profile.shape)] ?? {}
  return Boolean(columns.firstName && columns.lastName && profile.tables[clientRole(profile.shape)])
}

export function defaultProfileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').trim()
  return (base || 'Import layout').slice(0, 100)
}

export function emptyProfile(name: string, shape: ImportShape = 'flat'): ImportMappingProfile {
  return {
    name,
    shape,
    tables: { clients: null, medEnrollments: null, otherEnrollments: null, contacts: null, rows: null },
    columns: { clients: {}, medEnrollments: {}, otherEnrollments: {}, contacts: {}, rows: {} },
  }
}

export function suggestImportMapping(
  workbook: SourceWorkbook,
  options: { shape?: ImportShape; name?: string } = {},
): MappingSuggestion {
  const name = options.name ?? defaultProfileName(workbook.fileName)
  if (options.shape) {
    return {
      profile: suggestShape(workbook, options.shape, name),
      confidence: 'suggested',
    }
  }

  if (isDustinWorkbook(workbook)) {
    const profile = suggestNormalized(workbook, name)
    const columns = profile.columns.clients
    const confidence = columns.clientId && columns.firstName && columns.lastName ? 'exact' : 'suggested'
    return { profile, confidence }
  }

  if (workbook.tables.length === 1) {
    return { profile: suggestSingleTable(workbook.tables[0], name), confidence: 'suggested' }
  }

  const clientTable = bestTable(workbook.tables, CLIENT_FIELDS, ['firstName', 'lastName'])
  const others = workbook.tables.filter((table) => table !== clientTable)
  const medTable = bestTable(others, MED_FIELDS, ['medPlan', 'drugPlan'], { match: 'any', minimum: 70 })
  const secondaryTable = bestTable(others, SECONDARY_FIELDS, ['secondaryPlan'], { match: 'any', minimum: 70 })
  const contactTable = bestTable(others, CONTACT_FIELDS, ['contactDate', 'contactSummary', 'contactFollowUp'], { match: 'any', minimum: 70 })

  if (clientTable && (medTable || secondaryTable || contactTable)) {
    const profile = emptyProfile(name, 'normalized')
    assignRole(profile, 'clients', clientTable, roleFields('normalized', 'clients'))
    if (medTable) assignRole(profile, 'medEnrollments', medTable, roleFields('normalized', 'medEnrollments'))
    if (secondaryTable) assignRole(profile, 'otherEnrollments', secondaryTable, roleFields('normalized', 'otherEnrollments'))
    if (contactTable) assignRole(profile, 'contacts', contactTable, roleFields('normalized', 'contacts'))
    return { profile, confidence: 'suggested' }
  }

  const table = clientTable ?? workbook.tables[0]
  return { profile: suggestSingleTable(table, name), confidence: 'suggested' }
}

export function suggestRoleColumns(table: SourceTable, fields: TargetField[]): Record<string, string> {
  return assignColumns(table, fields)
}

export function listIgnoredColumns(
  workbook: SourceWorkbook,
  profile: ImportMappingProfile,
): { table: string; column: string }[] {
  const ignored: { table: string; column: string }[] = []
  for (const section of mappingSections(profile.shape)) {
    const tableName = profile.tables[section.role]
    if (!tableName) continue
    const table = findTable(workbook, tableName)
    if (!table) continue
    const used = new Set(
      Object.values(profile.columns[section.role] ?? {}).map((column) => normalizeHeader(column)),
    )
    for (const column of table.columns) {
      if (!used.has(normalizeHeader(column))) {
        ignored.push({ table: table.name, column })
      }
    }
  }
  return ignored
}

export function savedProfileFits(
  workbook: SourceWorkbook,
  saved: ImportMappingProfile & { importMappingProfileId?: string },
): ImportMappingProfile | null {
  const profile = emptyProfile(saved.name, saved.shape)
  for (const role of IMPORT_ROLES) {
    const bindings = saved.columns[role] ?? {}
    const boundColumns = Object.entries(bindings).filter(([, column]) => column)
    if (boundColumns.length === 0) continue
    const table = resolveTable(workbook, saved.tables[role], boundColumns.map(([, column]) => column))
    if (!table) return null
    const rewritten: Record<string, string> = {}
    for (const [fieldId, column] of boundColumns) {
      const actual = table.columns.find((header) => normalizeHeader(header) === normalizeHeader(column))
      if (!actual) return null
      rewritten[fieldId] = actual
    }
    profile.tables[role] = table.name
    profile.columns[role] = rewritten
  }

  if (!profileIsReady(profile)) return null
  return profile
}

export function bestFittingProfile(
  workbook: SourceWorkbook,
  savedProfiles: Array<ImportMappingProfile & { importMappingProfileId: string }>,
): { importMappingProfileId: string; profile: ImportMappingProfile } | null {
  let best: { importMappingProfileId: string; profile: ImportMappingProfile } | null = null
  let bestCount = -1
  for (const saved of savedProfiles) {
    const fitted = savedProfileFits(workbook, saved)
    if (!fitted) continue
    const count = Object.values(fitted.columns).reduce((total, columns) => total + Object.keys(columns).length, 0)
    if (count > bestCount) {
      best = { importMappingProfileId: saved.importMappingProfileId, profile: fitted }
      bestCount = count
    }
  }
  return best
}

export function overlaySavedProfile(
  workbook: SourceWorkbook,
  saved: ImportMappingProfile,
): { profile: ImportMappingProfile; missing: string[] } {
  const fitted = savedProfileFits(workbook, saved)
  if (fitted) return { profile: fitted, missing: [] }

  const profile = emptyProfile(saved.name, saved.shape)
  const missing: string[] = []
  for (const role of IMPORT_ROLES) {
    const bindings = Object.entries(saved.columns[role] ?? {}).filter(([, column]) => column)
    if (bindings.length === 0) continue
    const table = resolveTable(
      workbook,
      saved.tables[role],
      bindings.map(([, column]) => column),
    ) ?? findTable(workbook, saved.tables[role])
    if (!table) {
      missing.push(...bindings.map(([, column]) => column))
      continue
    }
    profile.tables[role] = table.name
    for (const [fieldId, column] of bindings) {
      const actual = table.columns.find((header) => normalizeHeader(header) === normalizeHeader(column))
      if (actual) profile.columns[role][fieldId] = actual
      else missing.push(column)
    }
  }
  return { profile, missing }
}

export function applyImportMapping(
  workbook: SourceWorkbook,
  profile: ImportMappingProfile,
): AccessImportModel {
  if (profile.shape === 'normalized') {
    return applyNormalized(workbook, profile)
  }
  const table = findTable(workbook, profile.tables.rows)
  if (!table) {
    return { clients: [], medEnrollments: [], otherEnrollments: [], contacts: [] }
  }
  return profile.shape === 'ledger'
    ? applyLedger(table, profile.columns.rows)
    : applyFlat(table, profile.columns.rows)
}

function roleFields(shape: ImportShape, role: ImportRole): TargetField[] {
  return mappingSections(shape).find((section) => section.role === role)?.fields ?? []
}

function suggestShape(workbook: SourceWorkbook, shape: ImportShape, name: string): ImportMappingProfile {
  if (shape === 'normalized') {
    return isDustinWorkbook(workbook)
      ? suggestNormalized(workbook, name)
      : suggestNormalizedFromScores(workbook, name)
  }
  const table = bestTable(workbook.tables, CLIENT_FIELDS, ['firstName', 'lastName']) ?? workbook.tables[0]
  const profile = emptyProfile(name, shape)
  if (table) {
    const fields = mappingSections(shape)[0]?.fields ?? []
    assignRole(profile, 'rows', table, fields)
    shareDateColumns(profile.columns.rows)
  }
  return profile
}

function suggestNormalized(workbook: SourceWorkbook, name: string): ImportMappingProfile {
  const profile = emptyProfile(name, 'normalized')
  assignNamed(profile, workbook, 'clients', DUSTIN_TABLES.clients, roleFields('normalized', 'clients'))
  assignNamed(profile, workbook, 'medEnrollments', DUSTIN_TABLES.medEnrollments, roleFields('normalized', 'medEnrollments'))
  assignNamed(profile, workbook, 'otherEnrollments', DUSTIN_TABLES.otherEnrollments, roleFields('normalized', 'otherEnrollments'))
  assignNamed(profile, workbook, 'contacts', DUSTIN_TABLES.contacts, roleFields('normalized', 'contacts'))
  return profile
}

function suggestNormalizedFromScores(workbook: SourceWorkbook, name: string): ImportMappingProfile {
  const profile = emptyProfile(name, 'normalized')
  const clientTable = bestTable(workbook.tables, CLIENT_FIELDS, ['firstName', 'lastName']) ?? workbook.tables[0]
  if (!clientTable) return profile
  assignRole(profile, 'clients', clientTable, roleFields('normalized', 'clients'))
  const remaining = workbook.tables.filter((table) => table.name !== clientTable.name)
  const medTable = bestTable(remaining, MED_FIELDS, ['medPlan', 'drugPlan'], { match: 'any' })
  const secondaryTable = bestTable(remaining, SECONDARY_FIELDS, ['secondaryPlan'], { match: 'any' })
  const contactTable = bestTable(remaining, CONTACT_FIELDS, ['contactDate', 'contactSummary'], { match: 'any' })
  if (medTable) assignRole(profile, 'medEnrollments', medTable, roleFields('normalized', 'medEnrollments'))
  if (secondaryTable) assignRole(profile, 'otherEnrollments', secondaryTable, roleFields('normalized', 'otherEnrollments'))
  if (contactTable) assignRole(profile, 'contacts', contactTable, roleFields('normalized', 'contacts'))
  return profile
}

function suggestSingleTable(table: SourceTable, name: string): ImportMappingProfile {
  const shape: ImportShape = looksLikeLedger(table) ? 'ledger' : 'flat'
  const profile = emptyProfile(name, shape)
  assignRole(profile, 'rows', table, mappingSections(shape)[0].fields)
  shareDateColumns(profile.columns.rows)
  return profile
}

function assignNamed(
  profile: ImportMappingProfile,
  workbook: SourceWorkbook,
  role: ImportRole,
  tableName: string,
  fields: TargetField[],
) {
  const table = findTable(workbook, tableName)
  if (table) assignRole(profile, role, table, fields)
}

function assignRole(
  profile: ImportMappingProfile,
  role: ImportRole,
  table: SourceTable,
  fields: TargetField[],
) {
  profile.tables[role] = table.name
  profile.columns[role] = assignColumns(table, fields)
}

function assignColumns(table: SourceTable, fields: TargetField[]): Record<string, string> {
  const samples = new Map<string, string[]>()
  const candidates: { fieldId: string; column: string; score: number }[] = []
  for (const field of fields) {
    for (const column of table.columns) {
      const synonymScore = scoreHeader(column, field.synonyms)
      const bonus = synonymScore >= 92 ? 0 : shapeBonus(field, sampleValues(table, column, samples))
      const score = synonymScore + bonus
      if (score >= 45) {
        candidates.push({ fieldId: field.id, column, score })
      }
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.fieldId.localeCompare(right.fieldId))
  const usedFields = new Set<string>()
  const usedColumns = new Set<string>()
  const mapped: Record<string, string> = {}
  for (const candidate of candidates) {
    const columnKey = normalizeHeader(candidate.column)
    if (usedFields.has(candidate.fieldId) || usedColumns.has(columnKey)) continue
    usedFields.add(candidate.fieldId)
    usedColumns.add(columnKey)
    mapped[candidate.fieldId] = candidate.column
  }
  return mapped
}

function shareDateColumns(columns: Record<string, string>) {
  if (!columns.secondaryStart && columns.medStart) columns.secondaryStart = columns.medStart
  if (!columns.secondaryDate && columns.medDate) columns.secondaryDate = columns.medDate
}

function looksLikeLedger(table: SourceTable): boolean {
  const kindField = LEDGER_FIELDS[0]
  const specificSynonyms = kindField.synonyms.filter((synonym) => {
    const norm = normalizeHeader(synonym)
    return norm !== 'type' && norm !== 'kind'
  })
  const kindColumn = table.columns.find((header) => scoreHeader(header, kindField.synonyms) >= 92)
  if (!kindColumn) return false
  const strongName = scoreHeader(kindColumn, specificSynonyms) >= 92
  const samples: string[] = []
  for (const row of table.rows) {
    if (samples.length >= 8) break
    const value = row[kindColumn]
    if (value == null || String(value).trim() === '') continue
    samples.push(String(value))
  }
  const classified = samples.filter((sample) => classifyCoverageKind(sample) != null).length
  const samplesLookLikeKinds = samples.length > 0 && classified >= Math.ceil(samples.length * 0.5)
  if (!strongName && !samplesLookLikeKinds) return false
  const planMapped = assignColumns(table, [...LEDGER_FIELDS, ...MED_FIELDS, ...SECONDARY_FIELDS])
  return Boolean(planMapped.planName || planMapped.medPlan || planMapped.drugPlan || planMapped.secondaryPlan)
}

function bestTable(
  tables: SourceTable[],
  fields: TargetField[],
  requiredIds: string[],
  options: { match?: 'all' | 'any'; minimum?: number } = {},
): SourceTable | null {
  const match = options.match ?? 'all'
  const minimum = options.minimum ?? 0
  let winner: SourceTable | null = null
  let winnerScore = -1
  for (const table of tables) {
    const mapped = assignColumns(table, fields)
    const hits = requiredIds.filter((id) => mapped[id])
    if (match === 'all' ? hits.length !== requiredIds.length : hits.length === 0) continue
    const score = hits.reduce((total, id) => total + scoreHeader(mapped[id], fieldSynonyms(id)), 0)
    if (score >= minimum && score > winnerScore) {
      winner = table
      winnerScore = score
    }
  }
  return winner
}

function fieldSynonyms(id: string): string[] {
  return FIELD_BY_ID.get(id)?.synonyms ?? []
}

function scoreHeader(header: string, synonyms: string[]): number {
  const norm = normalizeHeader(header)
  if (!norm) return 0
  let best = 0
  for (const synonym of synonyms) {
    const syn = normalizeHeader(synonym)
    if (!syn) continue
    if (norm === syn) {
      best = Math.max(best, syn === normalizeHeader(synonyms[0]) ? 100 : 92)
    } else if (syn.length >= 8 && norm.startsWith(syn)) {
      best = Math.max(best, 80)
    }
  }
  return best
}

function shapeBonus(field: TargetField, samples: string[]): number {
  if (!field.hint || samples.length === 0) return 0
  const matched = samples.filter((sample) => matchesHint(field.hint!, sample)).length
  return matched >= Math.ceil(samples.length * 0.6) ? 45 : 0
}

function matchesHint(hint: NonNullable<TargetField['hint']>, sample: string): boolean {
  const text = sample.trim()
  if (!text) return false
  if (hint === 'email') return text.includes('@') && text.includes('.')
  if (hint === 'state') return /^[A-Za-z]{2}$/.test(text)
  if (hint === 'postal') return /^\d{5}(?:-\d{4})?$/.test(text)
  if (hint === 'phone') {
    const digits = text.replace(/\D/g, '')
    return digits.length >= 7 && digits.length <= 15
  }
  if (hint === 'bool') return /^(?:yes|no|true|false|y|n|0|1)$/i.test(text)
  if (hint === 'date') {
    const parsed = new Date(text)
    return !Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() >= 1900 && parsed.getUTCFullYear() <= 2100
  }
  return /^[1-9][AC-HJ-NP-RT-Y][AC-HJ-NP-RT-Y0-9]\d[AC-HJ-NP-RT-Y][AC-HJ-NP-RT-Y0-9][AC-HJ-NP-RT-Y]\d[AC-HJ-NP-RT-Y]{2}\d{2}$/i.test(
    text.replace(/[-\s]/g, ''),
  )
}

function sampleValues(table: SourceTable, column: string, cache: Map<string, string[]>): string[] {
  const cached = cache.get(column)
  if (cached) return cached
  const samples: string[] = []
  for (const row of table.rows) {
    if (samples.length >= 8) break
    const value = row[column]
    if (value == null || String(value).trim() === '') continue
    samples.push(String(value))
  }
  cache.set(column, samples)
  return samples
}

function isDustinWorkbook(workbook: SourceWorkbook): boolean {
  return (Object.values(DUSTIN_TABLES) as string[]).every((name) => findTable(workbook, name))
}

function findTable(workbook: SourceWorkbook, name: string | null): SourceTable | undefined {
  if (!name) return undefined
  const norm = normalizeHeader(name)
  return workbook.tables.find((table) => normalizeHeader(table.name) === norm)
}

function resolveTable(
  workbook: SourceWorkbook,
  tableName: string | null,
  columns: string[],
): SourceTable | undefined {
  const named = findTable(workbook, tableName)
  if (named && columns.every((column) => hasColumn(named, column))) return named
  return workbook.tables.find((table) => columns.every((column) => hasColumn(table, column)))
}

function hasColumn(table: SourceTable, column: string): boolean {
  const norm = normalizeHeader(column)
  return table.columns.some((header) => normalizeHeader(header) === norm)
}

function applyNormalized(workbook: SourceWorkbook, profile: ImportMappingProfile): AccessImportModel {
  const ids = createIdAssigner()
  const clientTable = findTable(workbook, profile.tables.clients)
  const clients = (clientTable?.rows ?? []).map((row) => {
    const out = project(row, profile.columns.clients, CLIENT_FIELD_IDS)
    out.ClientID = ids.assign(readCell(row, profile.columns.clients.clientId))
    return out
  })

  return {
    clients,
    medEnrollments: projectLinked(
      findTable(workbook, profile.tables.medEnrollments),
      profile.columns.medEnrollments,
      MED_OUTPUT_IDS,
      ids,
    ),
    otherEnrollments: projectLinked(
      findTable(workbook, profile.tables.otherEnrollments),
      profile.columns.otherEnrollments,
      SECONDARY_OUTPUT_IDS,
      ids,
    ),
    contacts: projectLinked(
      findTable(workbook, profile.tables.contacts),
      profile.columns.contacts,
      ['clientId', ...CONTACT_OUTPUT_IDS],
      ids,
    ),
  }
}

function projectLinked(
  table: SourceTable | undefined,
  columns: Record<string, string>,
  fieldIds: string[],
  ids: IdAssigner,
): AccessRow[] {
  if (!table) return []
  return table.rows.map((row) => {
    const out = project(row, columns, fieldIds)
    const id = ids.lookup(readCell(row, columns.clientId))
    if (id != null) out.ClientID = id
    return out
  })
}

function applyFlat(table: SourceTable, columns: Record<string, string>): AccessImportModel {
  const ids = createIdAssigner()
  const clients: AccessRow[] = []
  const medEnrollments: AccessRow[] = []
  const otherEnrollments: AccessRow[] = []
  const contacts: AccessRow[] = []

  for (const row of table.rows) {
    const client = project(row, columns, CLIENT_FIELD_IDS)
    const clientId = ids.assign(readCell(row, columns.clientId))
    client.ClientID = clientId
    clients.push(client)
    pushCoverage(medEnrollments, otherEnrollments, row, columns, clientId, null)
    pushContact(contacts, row, columns, clientId)
  }

  return { clients, medEnrollments, otherEnrollments, contacts }
}

function applyLedger(table: SourceTable, columns: Record<string, string>): AccessImportModel {
  const ids = createIdAssigner()
  const groups = new Map<string, AccessRow>()
  const medEnrollments: AccessRow[] = []
  const otherEnrollments: AccessRow[] = []
  const contacts: AccessRow[] = []

  for (const row of table.rows) {
    const rawId = readCell(row, columns.clientId)
    const key = hasValue(rawId)
      ? `id:${normalizeHeader(String(rawId))}`
      : `name:${normalizeHeader(String(readCell(row, columns.firstName) ?? ''))}|${normalizeHeader(String(readCell(row, columns.lastName) ?? ''))}|${normalizeHeader(String(readCell(row, columns.dateOfBirth) ?? ''))}`
    let client = groups.get(key)
    if (!client) {
      client = project(row, columns, CLIENT_FIELD_IDS)
      client.ClientID = ids.assign(hasValue(rawId) ? rawId : key)
      groups.set(key, client)
    } else {
      fillMissing(client, project(row, columns, CLIENT_FIELD_IDS))
    }
    const clientId = client.ClientID as number
    const kind = classifyCoverageKind(readCell(row, columns.coverageKind))
    pushCoverage(medEnrollments, otherEnrollments, row, columns, clientId, kind)
    pushContact(contacts, row, columns, clientId)
  }

  return {
    clients: [...groups.values()],
    medEnrollments,
    otherEnrollments,
    contacts,
  }
}

function pushCoverage(
  medEnrollments: AccessRow[],
  otherEnrollments: AccessRow[],
  row: AccessRow,
  columns: Record<string, string>,
  clientId: number,
  kind: CoverageKind | null,
) {
  const plan = textValue(readCell(row, columns.planName))
  const medName = textValue(readCell(row, columns.medPlan))
  const drugName = textValue(readCell(row, columns.drugPlan))
  const secondaryName = textValue(readCell(row, columns.secondaryPlan))

  const addMed = (name: string | null, drug: boolean) => {
    if (!name) return
    const out = project(row, columns, MED_OUTPUT_IDS)
    delete out.Enrollments
    delete out['RX Card']
    out.ClientID = clientId
    if (drug) out['RX Card'] = name
    else out.Enrollments = name
    medEnrollments.push(out)
  }
  const addSecondary = (name: string | null) => {
    if (!name) return
    const out = project(row, columns, SECONDARY_OUTPUT_IDS)
    out.ClientID = clientId
    out['Other Insurance'] = name
    if (!hasValue(out['Start Date']) && columns.medStart) {
      const start = readCell(row, columns.medStart)
      if (hasValue(start)) out['Start Date'] = start
    }
    otherEnrollments.push(out)
  }

  if (kind === 'medicare') addMed(medName ?? plan, false)
  else if (kind === 'drug') addMed(drugName ?? plan, true)
  else if (kind === 'secondary') addSecondary(secondaryName ?? plan)
  else {
    if (medName) addMed(medName, false)
    if (drugName) addMed(drugName, true)
    if (secondaryName) addSecondary(secondaryName)
    if (!medName && !drugName && !secondaryName && plan) addMed(plan, false)
  }
}

function pushContact(
  contacts: AccessRow[],
  row: AccessRow,
  columns: Record<string, string>,
  clientId: number,
) {
  const summary = textValue(readCell(row, columns.contactSummary))
  const notes = textValue(readCell(row, columns.contactNotes))
  const date = readCell(row, columns.contactDate)
  const followUp = readCell(row, columns.contactFollowUp)
  if (!summary && !notes && !hasValue(date) && !hasValue(followUp)) return
  const out = project(row, columns, CONTACT_OUTPUT_IDS)
  out.ClientID = clientId
  contacts.push(out)
}

function project(row: AccessRow, columns: Record<string, string>, fieldIds: string[]): AccessRow {
  const out: AccessRow = {}
  for (const fieldId of fieldIds) {
    const field = FIELD_BY_ID.get(fieldId)
    if (!field?.canonical) continue
    const value = readCell(row, columns[fieldId])
    if (!hasValue(value)) continue
    out[field.canonical] = value
  }
  return out
}

function fillMissing(target: AccessRow, source: AccessRow) {
  for (const [key, value] of Object.entries(source)) {
    if (!hasValue(target[key]) && hasValue(value)) target[key] = value
  }
}

type CoverageKind = 'medicare' | 'drug' | 'secondary'

function classifyCoverageKind(value: unknown): CoverageKind | null {
  if (!hasValue(value)) return null
  const norm = normalizeHeader(String(value))
  if (['medicare', 'med', 'mapd', 'medical', 'advantage', 'ma'].includes(norm) || norm.includes('medicare') || norm.includes('advantage')) {
    return 'medicare'
  }
  if (['drug', 'rx', 'pdp', 'partd', 'prescription'].includes(norm) || norm.includes('drug') || norm.includes('prescription')) {
    return 'drug'
  }
  if (
    ['secondary', 'other', 'dental', 'supplement', 'supplemental', 'hospital', 'indemnity'].includes(norm)
    || norm.includes('dental')
    || norm.includes('supplement')
    || norm.includes('secondary')
  ) {
    return 'secondary'
  }
  return null
}

interface IdAssigner {
  assign(raw: unknown): number
  lookup(raw: unknown): number | null
}

function createIdAssigner(): IdAssigner {
  const byKey = new Map<string, number>()
  const used = new Set<number>()
  let next = 1
  const claim = (raw: unknown): number => {
    const key = hasValue(raw) ? normalizeHeader(String(raw)) : null
    if (key && byKey.has(key)) return byKey.get(key)!
    const parsed = positiveInt(raw)
    let id = parsed != null && !used.has(parsed) ? parsed : next
    while (used.has(id)) {
      id += 1
    }
    used.add(id)
    next = Math.max(next, id + 1)
    if (key) byKey.set(key, id)
    return id
  }
  return {
    assign: claim,
    lookup(raw) {
      if (!hasValue(raw)) return null
      const key = normalizeHeader(String(raw))
      if (byKey.has(key)) return byKey.get(key)!
      const parsed = positiveInt(raw)
      return parsed != null && used.has(parsed) ? parsed : null
    },
  }
}

function positiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function readCell(row: AccessRow, column: string | undefined): unknown {
  if (!column) return null
  if (Object.prototype.hasOwnProperty.call(row, column)) return row[column]
  const norm = normalizeHeader(column)
  for (const [key, value] of Object.entries(row)) {
    if (normalizeHeader(key) === norm) return value
  }
  return null
}

function textValue(value: unknown): string | null {
  if (!hasValue(value)) return null
  return String(value).trim()
}

function hasValue(value: unknown): boolean {
  return value != null && !(typeof value === 'string' && value.trim() === '')
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}
