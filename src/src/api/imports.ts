import { apiDelete, apiGet, apiPost, type ApiRequestOptions } from '@/api/apiFetch'
import type {
  AccessImportModel,
  AccessImportResultDto,
  ImportMappingProfileDto,
  SaveImportMappingProfileModel,
} from '@/types/apiModels'

export function importAccessDatabase(
  model: AccessImportModel,
  options: ApiRequestOptions = {},
) {
  return apiPost<AccessImportResultDto>('/api/imports/access', model, options)
}

export function listImportMappingProfiles(options: ApiRequestOptions = {}) {
  return apiGet<ImportMappingProfileDto[]>('/api/imports/profiles', options)
}

export function saveImportMappingProfile(
  model: SaveImportMappingProfileModel,
  options: ApiRequestOptions = {},
) {
  return apiPost<ImportMappingProfileDto>('/api/imports/profiles', model, options)
}

export function deleteImportMappingProfile(importMappingProfileId: string, options: ApiRequestOptions = {}) {
  return apiDelete(`/api/imports/profiles/${importMappingProfileId}`, options)
}
