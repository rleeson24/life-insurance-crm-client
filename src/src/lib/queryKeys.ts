export const queryKeys = {
  followUps: ['follow-ups'] as const,
  clients: (params: Record<string, unknown>) => ['clients', params] as const,
  clientDetail: (clientId: string) => ['client-detail', clientId] as const,
  activeClientCount: ['active-client-count'] as const,
}
