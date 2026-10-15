import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminImportPage } from '@/pages/AdminImportPage'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import type { SourceWorkbook } from '@/lib/workbook'

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/imports', () => ({
  importAccessDatabase: vi.fn(),
  listImportMappingProfiles: vi.fn(),
  saveImportMappingProfile: vi.fn(),
  deleteImportMappingProfile: vi.fn(),
}))

vi.mock('@/lib/workbook', async () => {
  const actual = await vi.importActual<typeof import('@/lib/workbook')>('@/lib/workbook')
  return {
    ...actual,
    readWorkbookFile: vi.fn(),
  }
})

import { getCurrentUser } from '@/api/me'
import { listImportMappingProfiles } from '@/api/imports'
import { readWorkbookFile } from '@/lib/workbook'

const flatWorkbook: SourceWorkbook = {
  fileName: 'agency.xlsx',
  kind: 'excel',
  strippedColumns: [],
  tables: [
    {
      name: 'Clients',
      columns: ['First Name', 'Last Name', 'Medicare Plan'],
      rows: [{ 'First Name': 'Jane', 'Last Name': 'Doe', 'Medicare Plan': 'Humana Gold' }],
    },
  ],
}

describe('AdminImportPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))
    vi.mocked(listImportMappingProfiles).mockResolvedValue([])
    vi.mocked(readWorkbookFile).mockResolvedValue(flatWorkbook)
  })

  it('asks the admin to confirm a suggested column map before import', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminImportPage />, { route: '/admin/import' })

    const input = await screen.findByLabelText('Broker workbook')
    await user.upload(
      input,
      new File(['xlsx'], 'agency.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )

    expect(await screen.findByLabelText('First name *')).toHaveValue('First Name')
    expect(screen.getByLabelText('Medicare plan')).toHaveValue('Medicare Plan')
    expect(screen.queryByRole('button', { name: 'Import into this organization' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review import' }))

    expect(await screen.findByRole('button', { name: 'Import into this organization' })).toBeEnabled()
    expect(screen.getByText('Medicare plans')).toBeInTheDocument()
  })
})
