import { Buffer } from 'buffer'
import readXlsxFile from 'read-excel-file/universal'
import type { AccessRow } from '@/types/apiModels'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const CREDENTIAL_KEYS = new Set(['username', 'password'])

export class WorkbookReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkbookReadError'
  }
}

export interface SourceTable {
  name: string
  columns: string[]
  rows: AccessRow[]
}

export interface SourceWorkbook {
  fileName: string
  kind: 'access' | 'excel'
  tables: SourceTable[]
  strippedColumns: string[]
}

export async function readWorkbookFile(file: File): Promise<SourceWorkbook> {
  if (file.size > MAX_FILE_BYTES) {
    throw new WorkbookReadError('The file is larger than 20 MB.')
  }

  const kind = fileKind(file)
  if (kind === 'xls') {
    throw new WorkbookReadError('Excel 97-2003 .xls files need to be saved as .xlsx first.')
  }
  if (kind === 'unknown') {
    throw new WorkbookReadError('Use an Access database (.accdb, .mdb) or an Excel workbook (.xlsx).')
  }

  try {
    return kind === 'access' ? await readAccessFile(file) : await readExcelFile(file)
  } catch (error) {
    if (error instanceof WorkbookReadError) {
      throw error
    }
    throw new WorkbookReadError(
      kind === 'access'
        ? 'Unable to read this Access file.'
        : 'Unable to read this Excel file.',
    )
  }
}

function fileKind(file: File): 'access' | 'excel' | 'xls' | 'unknown' {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xls') && !name.endsWith('.xlsx') && !name.endsWith('.xlsm')) {
    return 'xls'
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
    return 'excel'
  }
  if (name.endsWith('.accdb') || name.endsWith('.mdb')) {
    return 'access'
  }
  const type = file.type.toLowerCase()
  if (type.includes('spreadsheet') || type.includes('excel')) {
    return 'excel'
  }
  if (type.includes('msaccess') || type.includes('ms-access')) {
    return 'access'
  }
  return 'unknown'
}

async function readAccessFile(file: File): Promise<SourceWorkbook> {
  ensureNodeShims()
  const { default: AccessReader } = await import('mdb-reader')
  const reader = new AccessReader(Buffer.from(await file.arrayBuffer()))
  const stripped = new Set<string>()
  const tables = reader
    .getTableNames()
    .map((name) => {
      const table = reader.getTable(name)
      return buildTableFromRecords(name, table.getColumnNames(), table.getData(), stripped)
    })
    .filter((table) => table.name.trim().length > 0)

  if (tables.length === 0) {
    throw new WorkbookReadError('This Access file has no tables.')
  }

  return {
    fileName: file.name,
    kind: 'access',
    tables,
    strippedColumns: [...stripped],
  }
}

async function readExcelFile(file: File): Promise<SourceWorkbook> {
  const sheets = await readXlsxFile(file)
  const stripped = new Set<string>()
  const tables = sheets
    .map((sheet) => buildTable(sheet.sheet, sheet.data, stripped))
    .filter((table): table is SourceTable => table !== null && table.columns.length > 0)

  if (tables.length === 0) {
    throw new WorkbookReadError('This workbook has no sheets with a header row.')
  }

  return {
    fileName: file.name,
    kind: 'excel',
    tables,
    strippedColumns: [...stripped],
  }
}

function buildTableFromRecords(
  name: string,
  columnNames: string[],
  records: Record<string, unknown>[],
  stripped: Set<string>,
): SourceTable {
  const columns: string[] = []
  const kept: string[] = []
  const used = new Set<string>()
  for (const columnName of columnNames) {
    if (isCredential(columnName)) {
      stripped.add(columnName)
      continue
    }
    const header = uniqueHeader(columnName, used)
    columns.push(header)
    kept.push(columnName)
  }

  const rows = records.map((record) => {
    const row: AccessRow = {}
    for (let index = 0; index < kept.length; index += 1) {
      row[columns[index]] = serializeValue(record[kept[index]])
    }
    return row
  })

  return { name, columns, rows }
}

function buildTable(
  name: string,
  matrix: unknown[][],
  stripped: Set<string>,
): SourceTable | null {
  const headerRow = matrix[0] ?? []
  const columns: string[] = []
  const indexes: number[] = []
  const used = new Set<string>()

  headerRow.forEach((cell, index) => {
    const header = cell == null ? '' : String(cell).trim()
    if (!header) {
      return
    }
    if (isCredential(header)) {
      stripped.add(header)
      return
    }
    columns.push(uniqueHeader(header, used))
    indexes.push(index)
  })

  if (columns.length === 0) {
    return null
  }

  const rows = matrix.slice(1).map((source) => {
    const row: AccessRow = {}
    indexes.forEach((sourceIndex, columnIndex) => {
      row[columns[columnIndex]] = serializeValue(source?.[sourceIndex])
    })
    return row
  }).filter((row) => Object.values(row).some((value) => value != null && value !== ''))

  return { name, columns, rows }
}

function uniqueHeader(header: string, used: Set<string>): string {
  const trimmed = header.trim()
  if (!used.has(normalizeHeader(trimmed))) {
    used.add(normalizeHeader(trimmed))
    return trimmed
  }
  let suffix = 2
  let next = `${trimmed} (${suffix})`
  while (used.has(normalizeHeader(next))) {
    suffix += 1
    next = `${trimmed} (${suffix})`
  }
  used.add(normalizeHeader(next))
  return next
}

function isCredential(header: string): boolean {
  return CREDENTIAL_KEYS.has(normalizeHeader(header))
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
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
