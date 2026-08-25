import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser'
import { apiScopes, loginRequest, msalConfig } from '@/auth/msalConfig'

export const msalInstance = new PublicClientApplication(msalConfig)

function firstAccount(): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null
}

export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize()
  const redirectResult = await msalInstance.handleRedirectPromise()
  const account = redirectResult?.account ?? firstAccount()
  if (account) {
    msalInstance.setActiveAccount(account)
  }
}

export async function getAccessToken(): Promise<string | null> {
  const account = firstAccount()
  if (!account) {
    return null
  }

  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: apiScopes,
    })
    return result.accessToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({
        ...loginRequest,
        account,
      })
      return null
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
