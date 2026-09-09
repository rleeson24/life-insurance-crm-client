import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessParseError, parseAccessDatabaseFile } from '@/lib/accessImport'

const getTableNames = vi.fn()
const getData = vi.fn()

vi.mock('mdb-reader', () => ({
  default: class MockAccessReader {
    getTableNames() {
      return getTableNames()
    }

    getTable() {
      return { getData }
    }
  },
}))

function accessFile(bytes = 16) {
  return new File([new Uint8Array(bytes)], 'book.accdb', {
    type: 'application/msaccess',
  })
}

describe('parseAccessDatabaseFile', () => {
  beforeEach(() => {
    getTableNames.mockReset()
    getData.mockReset()
  })

  it('rejects files larger than 20 MB', async () => {
    const file = accessFile(20 * 1024 * 1024 + 1)
    await expect(parseAccessDatabaseFile(file)).rejects.toBeInstanceOf(AccessParseError)
  })

  it('rejects databases missing required tables', async () => {
    getTableNames.mockReturnValue(['ClientsT'])
    await expect(parseAccessDatabaseFile(accessFile())).rejects.toThrow(
      /missing required tables/i,
    )
  })

  it('counts valid rows and warns about skipped ones', async () => {
    getTableNames.mockReturnValue([
      'ClientsT',
      'MEDEnrollmentT',
      'OtherEnrollmentT',
      '_contactT',
    ])
    getData
      .mockReturnValueOnce([
        { ClientID: 1, First: 'Jane', Last: 'Doe' },
        { ClientID: 1, First: 'Dup', Last: 'Row' },
        { ClientID: 2, First: '', Last: 'Skip' },
        { password: 'secret', ClientID: 3, First: 'Pat', Last: 'Lee' },
      ])
      .mockReturnValueOnce([
        {
          ClientID: 1,
          Enrollments: 'Humana Gold',
          'RX Card': 'Silver Rx',
          StartDate: '2026-01-01T00:00:00.000Z',
        },
        { ClientID: 99, Enrollments: 'Unknown client' },
      ])
      .mockReturnValueOnce([
        { ClientID: 1, 'Other Insurance': 'AARP', 'Start Date': '2026-02-01T00:00:00.000Z' },
      ])
      .mockReturnValueOnce([{ ClientID: 1, Notes: 'Called' }])

    const preview = await parseAccessDatabaseFile(accessFile())

    expect(preview.fileName).toBe('book.accdb')
    expect(preview.clients).toBe(2)
    expect(preview.majorMedical).toBe(1)
    expect(preview.drugPlans).toBe(1)
    expect(preview.secondary).toBe(1)
    expect(preview.contacts).toBe(1)
    expect(preview.payload.clients.some((row) => 'password' in row)).toBe(false)
    expect(preview.warnings.some((warning) => warning.includes('duplicate'))).toBe(true)
    expect(preview.warnings.some((warning) => warning.includes('unknown client'))).toBe(
      true,
    )
  })
})
