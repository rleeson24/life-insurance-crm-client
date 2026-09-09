import { InteractionStatus } from '@azure/msal-browser'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/apiFetch'
import { AuthGate } from '@/auth/AuthGate'
import { currentUser } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

const authState = vi.hoisted(() => ({
  inProgress: 'none' as string,
  isAuthenticated: false,
  accounts: [] as Array<{ name?: string; username?: string }>,
}))

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    inProgress: authState.inProgress,
    accounts: authState.accounts,
  }),
  useIsAuthenticated: () => authState.isAuthenticated,
}))

vi.mock('@/api/me', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/auth/auth', () => ({
  getAuthDisplayName: () => 'Signed in',
  login: vi.fn(),
  logout: vi.fn(),
}))

import { getCurrentUser } from '@/api/me'

describe('AuthGate', () => {
  beforeEach(() => {
    authState.inProgress = InteractionStatus.None
    authState.isAuthenticated = false
    authState.accounts = []
    vi.mocked(getCurrentUser).mockReset()
  })

  it('shows the guest welcome page when nobody is signed in', () => {
    renderWithProviders(
      <AuthGate>
        <p>Workspace</p>
      </AuthGate>,
    )

    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument()
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument()
  })

  it('shows a signing-in spinner while MSAL is busy', () => {
    authState.inProgress = InteractionStatus.HandleRedirect
    renderWithProviders(
      <AuthGate>
        <p>Workspace</p>
      </AuthGate>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/signing in/i)
  })

  it('shows a workspace spinner until /api/me resolves', () => {
    authState.isAuthenticated = true
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => undefined))

    renderWithProviders(
      <AuthGate>
        <p>Workspace</p>
      </AuthGate>,
    )

    expect(screen.getByText('Loading workspace')).toBeInTheDocument()
  })

  it('renders children after the current user loads', async () => {
    authState.isAuthenticated = true
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser())

    renderWithProviders(
      <AuthGate>
        <p>Workspace</p>
      </AuthGate>,
    )

    expect(await screen.findByText('Workspace')).toBeInTheDocument()
  })

  it('maps a 403 tenant error to the missing-account welcome page', async () => {
    authState.isAuthenticated = true
    authState.accounts = [{ name: 'Jane Doe', username: 'jane@contoso.com' }]
    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError('Tenant not found for user', 403, {
        detail: 'Tenant not found for user',
      }),
    )

    renderWithProviders(
      <AuthGate>
        <p>Workspace</p>
      </AuthGate>,
    )

    expect(
      await screen.findByRole('heading', { name: /don't have a brokerbook account/i }),
    ).toBeInTheDocument()
  })
})
