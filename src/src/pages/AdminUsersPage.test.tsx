import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import type { OrganizationUserDto } from '@/types/apiModels'

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/organizationUsers', () => ({
  listOrganizationUsers: vi.fn(),
  createOrganizationUser: vi.fn(),
  updateOrganizationUser: vi.fn(),
}))

vi.mock('@/api/tenants', () => ({
  listTenants: vi.fn(),
}))

import { getCurrentUser } from '@/api/me'
import { listOrganizationUsers } from '@/api/organizationUsers'

function organizationUser(): OrganizationUserDto {
  return {
    organizationUserId: '33333333-3333-3333-3333-333333333333',
    tenantId: '22222222-2222-2222-2222-222222222222',
    tenantName: 'Northwind',
    userId: '44444444-4444-4444-4444-444444444444',
    emailAddress: 'pat@example.com',
    displayName: 'Pat Lee',
    role: 'Agent',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(listOrganizationUsers).mockReset()
  })

  it('hides Add user for organization admins', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))
    vi.mocked(listOrganizationUsers).mockResolvedValue([organizationUser()])

    renderWithProviders(<AdminUsersPage />)

    expect(await screen.findAllByText('Pat Lee')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument()
  })

  it('hides Add user when the organization has no users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'Admin' }))
    vi.mocked(listOrganizationUsers).mockResolvedValue([])

    renderWithProviders(<AdminUsersPage />)

    expect(await screen.findByText('No users in this organization')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument()
  })

  it('shows Add user for super admins', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(listOrganizationUsers).mockResolvedValue([organizationUser()])

    renderWithProviders(<AdminUsersPage />)

    expect(await screen.findByRole('button', { name: /add user/i })).toBeInTheDocument()
  })
})
