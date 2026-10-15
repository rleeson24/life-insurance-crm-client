import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
import { listTenants, updateTenant } from '@/api/tenants'

const tenant: TenantDto = {
  tenantId: '22222222-2222-2222-2222-222222222222',
  name: 'Northwind',
  isActive: true,
  clientCount: 12,
  addressLine1: '100 Market St',
  addressLine2: 'Suite 4',
  city: 'Boston',
  state: 'MA',
  postalCode: '02110',
  noticesEmail: 'notices@northwind.test',
  incidentContact: 'Ada Lovelace',
  incidentTelephone: '555-0100',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminTenantsPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(listTenants).mockReset()
    vi.mocked(updateTenant).mockReset()
  })

  it('shows contact details before the status control', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(listTenants).mockResolvedValue([tenant])

    renderWithProviders(<AdminTenantsPage />)

    const headers = await screen.findAllByRole('columnheader')
    const labels = headers.map((header) => header.textContent)
    expect(labels).toEqual([
      'Organization',
      'Notices email',
      'Incident contact',
      'Tenant ID',
      'Clients',
      'Status',
      'Actions',
    ])
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)
    expect(screen.getAllByText('100 Market St').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Boston, MA 02110').length).toBeGreaterThan(0)
    expect(screen.getAllByText('notices@northwind.test').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
    expect(screen.getAllByText('555-0100').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Status for Northwind').length).toBeGreaterThan(0)
  })

  it('saves address, notices email, and incident contact', async () => {
    const user = userEvent.setup()
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(listTenants).mockResolvedValue([tenant])
    vi.mocked(updateTenant).mockResolvedValue({
      ...tenant,
      noticesEmail: 'ops@northwind.test',
    })

    renderWithProviders(<AdminTenantsPage />)

    await user.click((await screen.findAllByRole('button', { name: 'Edit Northwind' }))[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Address line 1')).toHaveValue('100 Market St')
    expect(within(dialog).getByLabelText('Notices email')).toHaveValue('notices@northwind.test')
    expect(within(dialog).getByLabelText('Incident contact')).toHaveValue('Ada Lovelace')
    expect(within(dialog).getByLabelText('Incident telephone')).toHaveValue('555-0100')

    await user.clear(within(dialog).getByLabelText('Notices email'))
    await user.type(within(dialog).getByLabelText('Notices email'), 'ops@northwind.test')
    await user.click(within(dialog).getByRole('button', { name: 'Save organization' }))

    expect(updateTenant).toHaveBeenCalledWith(tenant.tenantId, {
      name: 'Northwind',
      addressLine1: '100 Market St',
      addressLine2: 'Suite 4',
      city: 'Boston',
      state: 'MA',
      postalCode: '02110',
      noticesEmail: 'ops@northwind.test',
      incidentContact: 'Ada Lovelace',
      incidentTelephone: '555-0100',
    })
  })
})
