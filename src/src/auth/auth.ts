import {
  BrowserAuthError,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser'
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge'
import { recordLoginFailed, recordLoginSucceeded, recordLogout } from '@/api/authSession'
import { apiScopes, loginRequest, msalConfig } from '@/auth/msalConfig'
import { SessionExpiredError } from '@/auth/sessionExpired'

export const msalInstance = new PublicClientApplication(msalConfig)

const renewalErrorCodes = new Set([
  'timed_out',
  'iframe_closed_prematurely',
  'block_iframe_reload',
  'redirect_in_iframe',
  'interaction_in_progress',
  'redirect_bridge_empty_response',
])

function firstAccount(): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null
}

function renewalNeedsSignIn(error: unknown): boolean {
  if (error instanceof InteractionRequiredAuthError) {
    return true
  }

  return error instanceof BrowserAuthError && renewalErrorCodes.has(error.errorCode)
}

/**
 * Silent renewal loads this origin inside a hidden iframe and expects the
 * redirect bridge to hand the response back. Booting the app there starts
 * another authorize round-trip and the browser blocks it.
 */
export async function initializeMsal(): Promise<boolean> {
  if (window.self !== window.top) {
    try {
      await broadcastResponseToMainFrame()
    } catch {
      // No payload to relay. The parent frame times out and asks for sign-in.
    }
    return false
  }

  await msalInstance.initialize()
  let redirectResult: Awaited<ReturnType<PublicClientApplication['handleRedirectPromise']>>
  try {
    redirectResult = await msalInstance.handleRedirectPromise()
  } catch (error) {
    await reportLoginFailed(error)
    return true
  }

  const account = redirectResult?.account ?? firstAccount()
  if (account) {
    msalInstance.setActiveAccount(account)
  }

  if (redirectResult?.account) {
    try {
      await recordLoginSucceeded()
    } catch {
      // A missed audit row should not block the signed-in workspace.
    }
  }

  return true
}

let accessTokenRequest: Promise<string | null> | null = null

export function getAccessToken(): Promise<string | null> {
  const account = firstAccount()
  if (!account) {
    return Promise.resolve(null)
  }

  if (!accessTokenRequest) {
    accessTokenRequest = requestAccessToken(account).finally(() => {
      accessTokenRequest = null
    })
  }

  return accessTokenRequest
}

async function requestAccessToken(account: AccountInfo): Promise<string | null> {
  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: apiScopes,
    })
    return result.accessToken
  } catch (error) {
    if (renewalNeedsSignIn(error)) {
      // A full-page redirect here has no click behind it. Chrome treats the
      // immediate bounce back from Entra as a bounce tracker and blocks it,
      // which leaves the tab looping until site data is cleared.
      throw new SessionExpiredError()
    }
    throw error
  }
}

export function login(): Promise<void> {
  return msalInstance.loginRedirect(loginRequest)
}

export async function logout(): Promise<void> {
  try {
    await recordLogout()
  } catch {
    // Sign-out still proceeds when the audit call fails.
  }

  const account = firstAccount()
  await msalInstance.logoutRedirect({
    account: account ?? undefined,
  })
}

async function reportLoginFailed(error: unknown) {
  try {
    await recordLoginFailed(loginFailureReason(error))
  } catch {
    // The welcome page is still the right place to land.
  }
}

function loginFailureReason(error: unknown) {
  if (error && typeof error === 'object' && 'errorCode' in error) {
    const code = error.errorCode
    if (typeof code === 'string' && /^[A-Za-z0-9_]{1,64}$/.test(code)) {
      return code
    }
  }

  return 'login_failed'
}

export function getAuthDisplayName(): string {
  const account = firstAccount()
  return account?.name || account?.username || 'Signed in'
}
