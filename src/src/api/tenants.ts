import { apiGet, apiPatch, apiPost, type ApiRequestOptions } from '@/api/apiFetch'
import type { CreateTenantModel, TenantDto, UpdateTenantModel } from '@/types/apiModels'

export function listTenants(options: ApiRequestOptions = {}) {
  return apiGet<TenantDto[]>('/api/tenants', options)
}

export function createTenant(model: CreateTenantModel) {
  return apiPost<TenantDto>('/api/tenants', model)
}

export function updateTenant(tenantId: string, model: UpdateTenantModel) {
  return apiPatch<TenantDto>(`/api/tenants/${tenantId}`, model)
}
