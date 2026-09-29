import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTenantsPage } from '@/pages/AdminTenantsPage'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import type { TenantDto } from '@/types/apiModels'

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/tenants', () => ({
  listTenants: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}))

import { getCurrentUser } from '@/api/me'
import { listTenants } from '@/api/tenants'

const tenant: TenantDto = {
  tenantId: '22222222-2222-2222-2222-222222222222',
  name: 'Northwind',
  isActive: true,
  clientCount: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminTenantsPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(listTenants).mockReset()
  })

  it('shows client count before the status control', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(listTenants).mockResolvedValue([tenant])

    renderWithProviders(<AdminTenantsPage />)

    const headers = await screen.findAllByRole('columnheader')
    const labels = headers.map((header) => header.textContent)
    expect(labels).toEqual(['Organization', 'Tenant ID', 'Clients', 'Status'])
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Status for Northwind').length).toBeGreaterThan(0)
  })
})
