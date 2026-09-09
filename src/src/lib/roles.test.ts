import { describe, expect, it } from 'vitest'
import {
  canExportReports,
  canManageOrganizationUsers,
  isSuperAdmin,
  organizationRoles,
} from '@/lib/roles'

describe('roles', () => {
  it('allows admins and super admins to manage users', () => {
    expect(canManageOrganizationUsers(organizationRoles.admin)).toBe(true)
    expect(canManageOrganizationUsers(organizationRoles.superAdmin)).toBe(true)
    expect(canManageOrganizationUsers(organizationRoles.agent)).toBe(false)
    expect(canManageOrganizationUsers(undefined)).toBe(false)
  })

  it('allows only organization admins to export reports', () => {
    expect(canExportReports(organizationRoles.admin)).toBe(true)
    expect(canExportReports(organizationRoles.superAdmin)).toBe(false)
    expect(canExportReports(organizationRoles.agent)).toBe(false)
  })

  it('identifies platform operators', () => {
    expect(isSuperAdmin(organizationRoles.superAdmin)).toBe(true)
    expect(isSuperAdmin(organizationRoles.admin)).toBe(false)
  })
})
