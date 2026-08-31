import { Buffer } from 'buffer'
import type MDBReader from 'mdb-reader'
import type { AccessImportModel, AccessRow } from '@/types/apiModels'

function ensureNodeShims() {
  const globalWithShims = globalThis as typeof globalThis & {
    Buffer?: typeof Buffer
    process?: {
      env: { NODE_ENV: string }
      browser: boolean
      version: string
      nextTick: (cb: () => void) => void
    }
  }
  globalWithShims.Buffer = Buffer
  if (!globalWithShims.process) {
    globalWithShims.process = {
      env: { NODE_ENV: import.meta.env.MODE },
      browser: true,
      version: 'v18.0.0',
      nextTick: (cb) => queueMicrotask(cb),
    }
  }
}

const REQUIRED_TABLES = ['ClientsT', 'MEDEnrollmentT', 'OtherEnrollmentT', '_contactT'] as const
const CREDENTIAL_KEYS = new Set(['username', 'password'])
const MAX_FILE_BYTES = 20 * 1024 * 1024
const MIN_PLAN_YEAR = 1990
const MAX_PLAN_YEAR = 2100

export class AccessParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccessParseError'
  }
}

export interface AccessImportPreview {
  fileName: string
  payload: AccessImportModel
  clients: number
  majorMedical: number
  drugPlans: number
  secondary: number
  contacts: number
  medicarePlanNames: number
  drugPlanNames: number
  secondaryPlanNames: number
  warnings: string[]
}

export async function parseAccessDatabaseFile(file: File): Promise<AccessImportPreview> {
  if (file.size > MAX_FILE_BYTES) {
    throw new AccessParseError('The Access file is larger than 20 MB.')
  }

  ensureNodeShims()
  const { default: AccessReader } = await import('mdb-reader')
  const reader = new AccessReader(Buffer.from(await file.arrayBuffer()))
  const tableNames = reader.getTableNames()
  const missing = REQUIRED_TABLES.filter(
    (required) => !findTableName(tableNames, required),
  )
  if (missing.length > 0) {
    throw new AccessParseError(
      `This file is missing required tables: ${missing.join(', ')}. BrokerBook imports the Dustin Access layout (ClientsT, MEDEnrollmentT, OtherEnrollmentT, _contactT).`,
    )
  }

  const clients = readTable(reader, tableNames, 'ClientsT')
  const medEnrollments = readTable(reader, tableNames, 'MEDEnrollmentT')
  const otherEnrollments = readTable(reader, tableNames, 'OtherEnrollmentT')
  const contacts = readTable(reader, tableNames, '_contactT')
  const payload: AccessImportModel = {
    clients,
    medEnrollments,
    otherEnrollments,
    contacts,
  }

  return { fileName: file.name, payload, ...previewCounts(payload) }
}

function readTable(
  reader: MDBReader,
  tableNames: string[],
  requiredName: string,
): AccessRow[] {
  const name = findTableName(tableNames, requiredName)
  if (!name) {
    return []
  }

  return reader.getTable(name).getData().map(sanitizeRow)
}

function findTableName(tableNames: string[], requiredName: string): string | undefined {
  const normalized = normalizeKey(requiredName)
  return tableNames.find((name) => normalizeKey(name) === normalized)
}

function sanitizeRow(row: Record<string, unknown>): AccessRow {
  const sanitized: AccessRow = {}
  for (const [key, value] of Object.entries(row)) {
    if (CREDENTIAL_KEYS.has(normalizeKey(key))) {
      continue
    }
    sanitized[key] = serializeValue(value)
  }
  return sanitized
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'object' && value !== null) {
    return String(value)
  }
  return value ?? null
}

function previewCounts(payload: AccessImportModel) {
  const warnings: string[] = []
  const clientIds = new Set<number>()
  let clients = 0

  for (const row of payload.clients) {
    const accessClientId = getNumber(row, 'ClientID', 'Client ID')
    const first = getString(row, 'First')
    const last = getString(row, 'Last')
    if (accessClientId == null) {
      addWarning(warnings, 'Skipped a client row with no ClientID.')
      continue
    }
    if (!first || !last) {
      addWarning(warnings, `Skipped client without a first and last name (Access ClientID ${accessClientId}).`)
      continue
    }
    if (clientIds.has(accessClientId)) {
      addWarning(warnings, `Skipped duplicate Access ClientID ${accessClientId}.`)
      continue
    }
    clientIds.add(accessClientId)
    clients += 1
  }

  let majorMedical = 0
  let drugPlans = 0
  const medicareNames = new Set<string>()
  const drugNames = new Set<string>()
  const secondaryNames = new Set<string>()

  for (const row of payload.medEnrollments) {
    const accessClientId = getNumber(row, 'ClientID', 'Client ID')
    if (accessClientId == null || !clientIds.has(accessClientId)) {
      addWarning(warnings, `Skipped Medicare enrollment for unknown client ${accessClientId ?? 'unknown'}.`)
      continue
    }
    const planName = getString(row, 'Enrollments')
    const rxCard = getString(row, 'RX Card', 'RXCard')
    if (!planName && !rxCard) {
      addWarning(warnings, `Skipped Medicare enrollment with no plan name (Access ClientID ${accessClientId}).`)
      continue
    }
    const year = planYear(row)
    if (planName) {
      majorMedical += 1
      if (year != null) medicareNames.add(`${year}|${planName.toLowerCase()}`)
    }
    if (rxCard) {
      drugPlans += 1
      if (year != null) drugNames.add(`${year}|${rxCard.toLowerCase()}`)
    }
  }

  let secondary = 0
  for (const row of payload.otherEnrollments) {
    const accessClientId = getNumber(row, 'ClientID', 'Client ID')
    if (accessClientId == null || !clientIds.has(accessClientId)) {
      addWarning(warnings, `Skipped secondary enrollment for unknown client ${accessClientId ?? 'unknown'}.`)
      continue
    }
    const planOrCarrier = getString(row, 'Other Insurance', 'OtherInsurance')
    if (!planOrCarrier) {
      addWarning(warnings, `Skipped secondary enrollment with no plan or carrier (Access ClientID ${accessClientId}).`)
      continue
    }
    secondary += 1
    const year = planYear(row, 'Start Date', 'StartDate')
    if (year != null) secondaryNames.add(`${year}|${planOrCarrier.toLowerCase()}`)
  }

  let contacts = 0
  for (const row of payload.contacts) {
    const accessClientId = getNumber(row, 'ClientID', 'Client ID')
    if (accessClientId == null || !clientIds.has(accessClientId)) {
      addWarning(warnings, `Skipped contact for unknown client ${accessClientId ?? 'unknown'}.`)
      continue
    }
    contacts += 1
  }

  return {
    clients,
    majorMedical,
    drugPlans,
    secondary,
    contacts,
    medicarePlanNames: medicareNames.size,
    drugPlanNames: drugNames.size,
    secondaryPlanNames: secondaryNames.size,
    warnings,
  }
}

function planYear(row: AccessRow, ...startKeys: string[]): number | null {
  const start = getDate(row, ...(startKeys.length > 0 ? startKeys : ['StartDate', 'Start Date']))
  const recorded = getDate(row, 'Date') ?? getDate(row, 'ContactDate')
  const year = (start ?? recorded)?.getUTCFullYear()
  if (year == null || year < MIN_PLAN_YEAR || year > MAX_PLAN_YEAR) {
    return null
  }
  return year
}

function getString(row: AccessRow, ...names: string[]): string | null {
  const value = getValue(row, names)
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function getNumber(row: AccessRow, ...names: string[]): number | null {
  const value = getValue(row, names)
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null
  }
  return null
}

function getDate(row: AccessRow, ...names: string[]): Date | null {
  const value = getValue(row, names)
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function getValue(row: AccessRow, names: string[]): unknown {
  const index = new Map<string, unknown>()
  for (const [key, value] of Object.entries(row)) {
    index.set(normalizeKey(key), value)
  }
  for (const name of names) {
    if (index.has(normalizeKey(name))) {
      return index.get(normalizeKey(name))
    }
  }
  return undefined
}

function normalizeKey(key: string): string {
  return key.trim().replace(/[\s*[\]#]/g, '').toLowerCase()
}

function addWarning(warnings: string[], message: string) {
  if (warnings.length < 50) {
    warnings.push(message)
  }
}
