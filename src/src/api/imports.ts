import { apiPost, type ApiRequestOptions } from '@/api/apiFetch'
import type { AccessImportModel, AccessImportResultDto } from '@/types/apiModels'

export function importAccessDatabase(
  model: AccessImportModel,
  options: ApiRequestOptions = {},
) {
  return apiPost<AccessImportResultDto>('/api/imports/access', model, options)
}
