import { describe, expect, it } from 'vitest'
import { summarizeAccessImport } from '@/lib/accessImport'
import {
  applyImportMapping,
  bestFittingProfile,
  suggestImportMapping,
} from '@/lib/importMapping'
import type { SourceTable, SourceWorkbook } from '@/lib/workbook'
import type { AccessRow } from '@/types/apiModels'

function table(name: string, rows: AccessRow[]): SourceTable {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return { name, columns, rows }
}

function workbook(fileName: string, tables: SourceTable[]): SourceWorkbook {
  return { fileName, kind: 'excel', tables, strippedColumns: [] }
}

describe('suggestImportMapping', () => {
  it('recognizes the Dustin Access tables and keeps canonical columns', () => {
    const source = workbook('book.accdb', [
      table('ClientsT', [{ ClientID: 1, First: 'Jane', Last: 'Doe', 'Med#': '1EG4TE5MK73' }]),
      table('MEDEnrollmentT', [{ ClientID: 1, Enrollments: 'Humana Gold', 'RX Card': 'Silver Rx', StartDate: '2026-01-01' }]),
      table('OtherEnrollmentT', [{ ClientID: 1, 'Other Insurance': 'AARP' }]),
      table('_contactT', [{ ClientID: 1, Description: 'Called' }]),
    ])

    const suggestion = suggestImportMapping(source)
    expect(suggestion.confidence).toBe('exact')
    expect(suggestion.profile.shape).toBe('normalized')

    const payload = applyImportMapping(source, suggestion.profile)
    const summary = summarizeAccessImport(payload)
    expect(summary.clients).toBe(1)
    expect(summary.majorMedical).toBe(1)
    expect(summary.drugPlans).toBe(1)
    expect(summary.secondary).toBe(1)
    expect(summary.contacts).toBe(1)
    expect(payload.clients[0]?.First).toBe('Jane')
    expect(payload.clients[0]?.['Med#']).toBe('1EG4TE5MK73')
  })

  it('maps a flat workbook with different column names', () => {
    const source = workbook('agency.xlsx', [
      table('Clients', [
        {
          'First Name': 'Jane',
          'Last Name': 'Doe',
          'Medicare Plan': 'Humana Gold',
          'Drug Plan': 'Silver Rx',
          'Effective Date': '2026-01-01',
        },
      ]),
    ])

    const suggestion = suggestImportMapping(source)
    expect(suggestion.profile.shape).toBe('flat')
    expect(suggestion.profile.columns.rows.firstName).toBe('First Name')
    expect(suggestion.profile.columns.rows.medPlan).toBe('Medicare Plan')

    const payload = applyImportMapping(source, suggestion.profile)
    const summary = summarizeAccessImport(payload)
    expect(summary.clients).toBe(1)
    expect(summary.majorMedical).toBe(1)
    expect(summary.drugPlans).toBe(1)
    expect(payload.medEnrollments).toHaveLength(2)
    expect(payload.medEnrollments.filter((row) => row.Enrollments === 'Humana Gold')).toHaveLength(1)
    expect(payload.medEnrollments.filter((row) => row['RX Card'] === 'Silver Rx')).toHaveLength(1)
  })

  it('groups a coverage ledger into one client', () => {
    const source = workbook('ledger.xlsx', [
      table('Coverage', [
        { 'First Name': 'Jane', 'Last Name': 'Doe', 'Coverage Type': 'Medicare', 'Plan Name': 'Humana Gold' },
        { 'First Name': 'Jane', 'Last Name': 'Doe', 'Coverage Type': 'Drug', 'Plan Name': 'Silver Rx' },
        { 'First Name': 'Pat', 'Last Name': 'Lee', 'Coverage Type': 'Dental', 'Plan Name': 'AARP' },
      ]),
    ])

    const suggestion = suggestImportMapping(source)
    expect(suggestion.profile.shape).toBe('ledger')

    const payload = applyImportMapping(source, suggestion.profile)
    const summary = summarizeAccessImport(payload)
    expect(summary.clients).toBe(2)
    expect(summary.majorMedical).toBe(1)
    expect(summary.drugPlans).toBe(1)
    expect(summary.secondary).toBe(1)
  })

  it('reuses a saved layout when the sheet name changes but the columns match', () => {
    const source = workbook('march.xlsx', [
      table('March', [
        { 'First Name': 'Jane', 'Last Name': 'Doe' },
      ]),
    ])
    const saved = {
      importMappingProfileId: 'profile-1',
      name: 'Agency flat',
      shape: 'flat' as const,
      tables: { clients: null, medEnrollments: null, otherEnrollments: null, contacts: null, rows: 'January' },
      columns: {
        clients: {},
        medEnrollments: {},
        otherEnrollments: {},
        contacts: {},
        rows: { firstName: 'First Name', lastName: 'Last Name' },
      },
    }

    const match = bestFittingProfile(source, [saved])
    expect(match?.importMappingProfileId).toBe('profile-1')
    expect(match?.profile.tables.rows).toBe('March')

    const payload = applyImportMapping(source, match!.profile)
    expect(summarizeAccessImport(payload).clients).toBe(1)
  })
})
