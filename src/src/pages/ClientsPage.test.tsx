import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientsPage } from '@/pages/ClientsPage'
import { clientSummary } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

vi.mock('@/api/clients', () => ({
  listClients: vi.fn(),
}))

import { listClients } from '@/api/clients'

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.mocked(listClients).mockReset()
  })

  it('renders clients returned by the API', async () => {
    vi.mocked(listClients).mockResolvedValue({
      items: [clientSummary()],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    })

    renderWithProviders(<ClientsPage />)

    expect(await screen.findAllByRole('link', { name: 'Jane Doe' })).not.toHaveLength(0)
    expect(screen.getByRole('link', { name: /new client/i })).toHaveAttribute(
      'href',
      '/clients/new',
    )
  })

  it('shows an empty state when there are no clients', async () => {
    vi.mocked(listClients).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    })

    renderWithProviders(<ClientsPage />)

    expect(await screen.findByText('No clients found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create client/i })).toBeInTheDocument()
  })

  it('shows an error state when the API fails', async () => {
    vi.mocked(listClients).mockRejectedValue(new Error('offline'))

    renderWithProviders(<ClientsPage />)

    expect(await screen.findByText('Unable to load clients')).toBeInTheDocument()
  })

  it('searches clients from the search box', async () => {
    const user = userEvent.setup()
    vi.mocked(listClients).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    })

    renderWithProviders(<ClientsPage />)
    await screen.findByText('No clients found')

    await user.type(screen.getAllByRole('textbox', { name: /search clients/i })[0]!, 'pat')

    await vi.waitFor(() => {
      expect(listClients).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'pat', page: 1 }),
        expect.anything(),
      )
    })
  })
})
