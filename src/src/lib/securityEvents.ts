export const securityEventTypes = [
  'LoginSucceeded',
  'LoginFailed',
  'Logout',
  'TokenValidationFailed',
  'TokenExpired',
  'TenantResolved',
  'TenantAccessDenied',
  'Forbidden',
  'Unauthorized',
  'RateLimitExceeded',
  'ReportExported',
] as const

const eventTypeLabels: Record<string, string> = {
  LoginSucceeded: 'Login succeeded',
  LoginFailed: 'Login failed',
  Logout: 'Logout',
  TokenValidationFailed: 'Token validation failed',
  TokenExpired: 'Token expired',
  TenantResolved: 'Tenant resolved',
  TenantAccessDenied: 'Tenant access denied',
  Forbidden: 'Forbidden',
  Unauthorized: 'Unauthorized',
  RateLimitExceeded: 'Rate limit exceeded',
  ReportExported: 'Report exported',
}

export function formatSecurityEventType(eventType: string) {
  return eventTypeLabels[eventType] ?? eventType.replace(/([a-z])([A-Z])/g, '$1 $2')
}
