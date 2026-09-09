import { describe, expect, it } from 'vitest'
import { queryKeys } from '@/lib/queryKeys'

describe('queryKeys', () => {
  it('keeps parameterized keys stable', () => {
    expect(queryKeys.clients({ search: 'jane', page: 1 })).toEqual([
      'clients',
      { search: 'jane', page: 1 },
    ])
    expect(queryKeys.productionReport(2026)).toEqual(['reports', 'production', 2026])
    expect(queryKeys.organizationUsers()).toEqual(['organization-users', 'all'])
    expect(queryKeys.organizationUsers('tenant-1')).toEqual([
      'organization-users',
      'tenant-1',
    ])
  })
})
