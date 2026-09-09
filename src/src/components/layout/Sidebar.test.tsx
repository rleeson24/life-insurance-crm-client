import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '@/components/layout/Sidebar'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    accounts: [{ name: 'Pat Lee', username: 'pat@contoso.com' }],
  }),
}))

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/auth/auth', () => ({
  getAuthDisplayName: () => 'Pat Lee',
  logout: vi.fn(),
}))

import { getCurrentUser } from '@/api/me'

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
  })

  it('shows core nav for agents and hides admin links', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Agent' }))

    renderWithProviders(<Sidebar />)

    expect(await screen.findByText('Northwind')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Organizations' })).not.toBeInTheDocument()
    expect(screen.getByText('Northwind')).toBeInTheDocument()
  })

  it('shows admin links for organization admins', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))

    renderWithProviders(<Sidebar />)

    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plan names' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Import' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Organizations' })).not.toBeInTheDocument()
  })

  it('shows the organizations link for super admins', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))

    renderWithProviders(<Sidebar />)

    expect(await screen.findByRole('link', { name: 'Organizations' })).toBeInTheDocument()
  })
})
