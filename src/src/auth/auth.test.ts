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

import { getAccessToken, initializeMsal } from '@/auth/auth'
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
