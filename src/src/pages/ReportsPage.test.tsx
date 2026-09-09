import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportsPage } from '@/pages/ReportsPage'
import {
  bookOfBusinessRow,
  currentUser,
  productionReport,
  retentionReport,
} from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/reports', () => ({
  getBookOfBusinessReport: vi.fn(),
  getMailingListReport: vi.fn(),
  getProductionReport: vi.fn(),
  getRetentionReport: vi.fn(),
  exportBookOfBusinessReport: vi.fn(),
  exportMailingListReport: vi.fn(),
  exportProductionReport: vi.fn(),
  exportRetentionReport: vi.fn(),
}))

vi.mock('@/lib/csv', async () => {
  const actual = await vi.importActual<typeof import('@/lib/csv')>('@/lib/csv')
  return {
    ...actual,
    downloadCsv: vi.fn(),
  }
})

import { getCurrentUser } from '@/api/me'
import {
  exportProductionReport,
  getBookOfBusinessReport,
  getProductionReport,
  getRetentionReport,
} from '@/api/reports'
import { downloadCsv } from '@/lib/csv'

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(getProductionReport).mockReset()
    vi.mocked(getRetentionReport).mockReset()
    vi.mocked(getBookOfBusinessReport).mockReset()
    vi.mocked(exportProductionReport).mockReset()
    vi.mocked(downloadCsv).mockReset()
  })

  it('hides CSV export for agents and shows production rows', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Agent' }))
    vi.mocked(getProductionReport).mockResolvedValue(productionReport())
    vi.mocked(getRetentionReport).mockResolvedValue(retentionReport())

    renderWithProviders(<ReportsPage />)

    expect(await screen.findByText('Humana Gold')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument()
  })

  it('lets admins export the production report', async () => {
    const user = userEvent.setup()
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))
    vi.mocked(getProductionReport).mockResolvedValue(productionReport())
    vi.mocked(getRetentionReport).mockResolvedValue(retentionReport())
    vi.mocked(exportProductionReport).mockResolvedValue(productionReport())

    renderWithProviders(<ReportsPage />)

    const exportButtons = await screen.findAllByRole('button', { name: /export csv/i })
    await user.click(exportButtons[0]!)

    await vi.waitFor(() => {
      expect(exportProductionReport).toHaveBeenCalled()
      expect(downloadCsv).toHaveBeenCalled()
    })
  })

  it('loads the book of business when that tab is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))
    vi.mocked(getProductionReport).mockResolvedValue(productionReport())
    vi.mocked(getRetentionReport).mockResolvedValue(retentionReport())
    vi.mocked(getBookOfBusinessReport).mockResolvedValue({
      items: [bookOfBusinessRow()],
      truncated: false,
    })

    renderWithProviders(<ReportsPage />)
    expect(await screen.findAllByText('Humana Gold')).not.toHaveLength(0)

    await user.click(screen.getByRole('tab', { name: 'Book of business' }))

    expect(await screen.findByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/clients/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    )
  })
})
