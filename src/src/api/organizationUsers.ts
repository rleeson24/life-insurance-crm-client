import { apiGet, apiPatch, apiPost, type ApiRequestOptions } from '@/api/apiFetch'
import type {
  CreateOrganizationUserModel,
  OrganizationUserDto,
  UpdateOrganizationUserModel,
} from '@/types/apiModels'

export function listOrganizationUsers(options: ApiRequestOptions = {}) {
  return apiGet<OrganizationUserDto[]>('/api/organization-users', options)
}

export function createOrganizationUser(model: CreateOrganizationUserModel) {
  return apiPost<OrganizationUserDto>('/api/organization-users', model)
}

export function updateOrganizationUser(
  organizationUserId: string,
  model: UpdateOrganizationUserModel,
) {
  return apiPatch<OrganizationUserDto>(
    `/api/organization-users/${organizationUserId}`,
    model,
  )
}
