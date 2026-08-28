export const queryKeys = {
  followUps: ['follow-ups'] as const,
  clients: (params: Record<string, unknown>) => ['clients', params] as const,
  clientDetail: (clientId: string) => ['client-detail', clientId] as const,
  activeClientCount: ['active-client-count'] as const,
  me: ['me'] as const,
  tenants: ['tenants'] as const,
  organizationUsers: (tenantId?: string) =>
    ['organization-users', tenantId ?? 'all'] as const,
  planNames: (kind: string, year: number) => ['plan-names', kind, year] as const,
  planNameLookup: (kind: string, fromYear: number, toYear: number) =>
    ['plan-name-lookup', kind, fromYear, toYear] as const,
}
