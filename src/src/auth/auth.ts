import {
  BrowserAuthError,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser'
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge'
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
  const redirectResult = await msalInstance.handleRedirectPromise()
  const account = redirectResult?.account ?? firstAccount()
  if (account) {
    msalInstance.setActiveAccount(account)
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

export function logout(): Promise<void> {
  const account = firstAccount()
  return msalInstance.logoutRedirect({
    account: account ?? undefined,
  })
}

export function getAuthDisplayName(): string {
  const account = firstAccount()
  return account?.name || account?.username || 'Signed in'
}
