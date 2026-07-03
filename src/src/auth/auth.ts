/**
 * Development: the API uses DevelopmentAuthenticationHandler and does not require
 * a client token for local requests.
 *
 * Production: integrate MSAL / Entra ID here and attach bearer tokens in api/apiFetch.ts.
 */
export const isDevelopmentAuth = import.meta.env.DEV

export async function getAccessToken(): Promise<string | null> {
  // MSAL placeholder — return an access token when Azure AD auth is enabled.
  return null
}

export function getAuthDisplayName(): string {
  return isDevelopmentAuth ? 'Development User' : 'Signed in'
}
