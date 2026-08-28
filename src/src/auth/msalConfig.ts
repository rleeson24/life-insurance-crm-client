import type { Configuration, RedirectRequest } from '@azure/msal-browser'
import { LogLevel } from '@azure/msal-browser'

function requiredEnv(name: 'VITE_AZURE_AD_CLIENT_ID' | 'VITE_AZURE_AD_TENANT_ID'): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy src/.env.example to src/.env.local and set the Entra SPA values.`,
    )
  }
  return value
}

const clientId = requiredEnv('VITE_AZURE_AD_CLIENT_ID')
const tenantId = requiredEnv('VITE_AZURE_AD_TENANT_ID')

export const apiScopes = [
  import.meta.env.VITE_AZURE_AD_API_SCOPE?.trim() || 'api://6c970234-fee3-4568-97d8-7d015c903368/access_as_user',
]

export const loginRequest: RedirectRequest = {
  scopes: apiScopes,
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: `${window.location.origin}/`,
    postLogoutRedirectUri: `${window.location.origin}/`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
}
