import { BrowserAuthError, InteractionRequiredAuthError } from '@azure/msal-browser'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const msal = vi.hoisted(() => ({
  initialize: vi.fn(),
  handleRedirectPromise: vi.fn(),
  getActiveAccount: vi.fn(),
  getAllAccounts: vi.fn(),
  setActiveAccount: vi.fn(),
  acquireTokenSilent: vi.fn(),
  acquireTokenRedirect: vi.fn(),
  loginRedirect: vi.fn(),
  logoutRedirect: vi.fn(),
}))

const bridge = vi.hoisted(() => ({
  broadcastResponseToMainFrame: vi.fn(),
}))

vi.mock('@azure/msal-browser', async () => {
  const actual = await vi.importActual<typeof import('@azure/msal-browser')>('@azure/msal-browser')
  return {
    ...actual,
    PublicClientApplication: class {
      initialize = msal.initialize
      handleRedirectPromise = msal.handleRedirectPromise
      getActiveAccount = msal.getActiveAccount
      getAllAccounts = msal.getAllAccounts
      setActiveAccount = msal.setActiveAccount
      acquireTokenSilent = msal.acquireTokenSilent
      acquireTokenRedirect = msal.acquireTokenRedirect
      loginRedirect = msal.loginRedirect
      logoutRedirect = msal.logoutRedirect
    },
  }
})

vi.mock('@azure/msal-browser/redirect-bridge', () => ({
  broadcastResponseToMainFrame: bridge.broadcastResponseToMainFrame,
}))

vi.mock('@/api/authSession', () => ({
  recordLoginSucceeded: vi.fn(),
  recordLogout: vi.fn(),
  recordLoginFailed: vi.fn(),
}))

import { recordLoginFailed, recordLoginSucceeded, recordLogout } from '@/api/authSession'
import { getAccessToken, initializeMsal, logout } from '@/auth/auth'
import { SessionExpiredError } from '@/auth/sessionExpired'

const account = {
  homeAccountId: 'home',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant',
  username: 'jane@contoso.com',
  localAccountId: 'local',
}

describe('getAccessToken', () => {
  beforeEach(() => {
    msal.getActiveAccount.mockReturnValue(account)
    msal.getAllAccounts.mockReturnValue([account])
    msal.acquireTokenSilent.mockReset()
    msal.acquireTokenRedirect.mockReset()
  })

  it('returns a cached silent token', async () => {
    msal.acquireTokenSilent.mockResolvedValue({ accessToken: 'token-1' })

    await expect(getAccessToken()).resolves.toBe('token-1')
    expect(msal.acquireTokenRedirect).not.toHaveBeenCalled()
  })

  it('shares one silent request across overlapping callers', async () => {
    let resolveToken: (value: { accessToken: string }) => void = () => undefined
    msal.acquireTokenSilent.mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve
      }),
    )

    const first = getAccessToken()
    const second = getAccessToken()
    resolveToken({ accessToken: 'token-1' })

    await expect(Promise.all([first, second])).resolves.toEqual(['token-1', 'token-1'])
    expect(msal.acquireTokenSilent).toHaveBeenCalledOnce()
  })

  it('does not redirect when Entra requires interaction', async () => {
    msal.acquireTokenSilent.mockRejectedValue(
      new InteractionRequiredAuthError('interaction_required', 'corr'),
    )

    await expect(getAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(msal.acquireTokenRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect when the silent frame times out', async () => {
    msal.acquireTokenSilent.mockRejectedValue(new BrowserAuthError('timed_out', 'corr'))

    await expect(getAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(msal.acquireTokenRedirect).not.toHaveBeenCalled()
  })
})

describe('initializeMsal', () => {
  beforeEach(() => {
    bridge.broadcastResponseToMainFrame.mockReset()
    msal.initialize.mockReset()
    msal.handleRedirectPromise.mockReset()
    msal.getActiveAccount.mockReset()
    msal.getAllAccounts.mockReset()
    msal.logoutRedirect.mockReset()
    vi.mocked(recordLoginSucceeded).mockReset()
    vi.mocked(recordLogout).mockReset()
    vi.mocked(recordLoginFailed).mockReset()
  })

  it('records a successful login when Entra redirects back with an account', async () => {
    msal.handleRedirectPromise.mockResolvedValue({ account })
    vi.mocked(recordLoginSucceeded).mockResolvedValue(undefined)

    await expect(initializeMsal()).resolves.toBe(true)

    expect(msal.setActiveAccount).toHaveBeenCalledWith(account)
    expect(recordLoginSucceeded).toHaveBeenCalledOnce()
    expect(recordLoginFailed).not.toHaveBeenCalled()
  })

  it('records a failed login when the Entra redirect returns an error', async () => {
    msal.handleRedirectPromise.mockRejectedValue(new BrowserAuthError('access_denied', 'corr'))
    vi.mocked(recordLoginFailed).mockResolvedValue(undefined)

    await expect(initializeMsal()).resolves.toBe(true)

    expect(recordLoginFailed).toHaveBeenCalledWith('access_denied')
    expect(recordLoginSucceeded).not.toHaveBeenCalled()
  })

  it('still signs out when the logout audit call fails', async () => {
    msal.getActiveAccount.mockReturnValue(account)
    msal.logoutRedirect.mockResolvedValue(undefined)
    vi.mocked(recordLogout).mockRejectedValue(new Error('offline'))

    await logout()

    expect(recordLogout).toHaveBeenCalledOnce()
    expect(msal.logoutRedirect).toHaveBeenCalledOnce()
  })

  it('relays the auth response and skips startup inside the renewal frame', async () => {
    bridge.broadcastResponseToMainFrame.mockResolvedValue(undefined)
    const top = vi.spyOn(window, 'top', 'get').mockReturnValue({} as Window)

    await expect(initializeMsal()).resolves.toBe(false)
    expect(bridge.broadcastResponseToMainFrame).toHaveBeenCalledOnce()
    expect(msal.initialize).not.toHaveBeenCalled()

    top.mockRestore()
  })
})
