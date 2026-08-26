export const queryKeys = {
  followUps: ['follow-ups'] as const,
  clients: (params: Record<string, unknown>) => ['clients', params] as const,
  clientDetail: (clientId: string) => ['client-detail', clientId] as const,
  activeClientCount: ['active-client-count'] as const,
  me: ['me'] as const,
  tenants: ['tenants'] as const,
  organizationUsers: (tenantId?: string) =>
    ['organization-users', tenantId ?? 'all'] as const,
}
