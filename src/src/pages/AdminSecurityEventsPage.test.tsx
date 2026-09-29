import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminSecurityEventDetailPage } from '@/pages/AdminSecurityEventDetailPage'
import { AdminSecurityEventsPage } from '@/pages/AdminSecurityEventsPage'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import type { AuthSecurityEventDto } from '@/types/apiModels'

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/authSecurityEvents', () => ({
  listAuthSecurityEvents: vi.fn(),
  getAuthSecurityEvent: vi.fn(),
}))

import { getAuthSecurityEvent, listAuthSecurityEvents } from '@/api/authSecurityEvents'
import { getCurrentUser } from '@/api/me'

const securityEvent: AuthSecurityEventDto = {
  authSecurityEventId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  tenantId: '22222222-2222-2222-2222-222222222222',
  tenantName: 'Northwind',
  occurredAt: '2026-03-01T15:05:00.000Z',
  eventType: 'LoginFailed',
  userId: '11111111-1111-1111-1111-111111111111',
  userEmail: 'pat@contoso.com',
  success: false,
  failureReason: 'Unknown user',
  ipAddress: '127.0.0.1',
  userAgent: 'TestAgent',
  correlationId: 'corr-1',
  resource: '/api/me',
}

describe('AdminSecurityEventsPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(listAuthSecurityEvents).mockReset()
  })

  it('lists auth security events for a super admin', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(listAuthSecurityEvents).mockResolvedValue({
      items: [securityEvent],
      totalCount: 1,
      page: 1,
      pageSize: 50,
    })

    renderWithProviders(<AdminSecurityEventsPage />)

    expect(await screen.findAllByText('pat@contoso.com')).not.toHaveLength(0)
    expect(screen.getAllByText('Northwind').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /2026/ }).length).toBeGreaterThan(0)
  })
})

describe('AdminSecurityEventDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(getAuthSecurityEvent).mockReset()
  })

  it('shows the full security event', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser({ role: 'SuperAdmin' }))
    vi.mocked(getAuthSecurityEvent).mockResolvedValue(securityEvent)

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/security-events/:eventId"
          element={<AdminSecurityEventDetailPage />}
        />
      </Routes>,
      { route: `/admin/security-events/${securityEvent.authSecurityEventId}` },
    )

    expect(await screen.findByText('Unknown user')).toBeInTheDocument()
    expect(screen.getByText('TestAgent')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Security events' })).toHaveAttribute(
      'href',
      '/admin/security-events',
    )
  })
})