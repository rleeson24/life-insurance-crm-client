export const organizationRoles = {
  superAdmin: 'SuperAdmin',
  admin: 'Admin',
  agent: 'Agent',
  readOnly: 'ReadOnly',
} as const

export function canManageOrganizationUsers(role?: string) {
  return role === organizationRoles.admin || role === organizationRoles.superAdmin
}

export function canExportReports(role?: string) {
  return role === organizationRoles.admin
}

export function isSuperAdmin(role?: string) {
  return role === organizationRoles.superAdmin
}
