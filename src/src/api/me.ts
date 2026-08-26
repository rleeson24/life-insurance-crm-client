import { apiGet, type ApiRequestOptions } from '@/api/apiFetch'
import type { CurrentUserDto } from '@/types/apiModels'

export function getCurrentUser(options: ApiRequestOptions = {}) {
  return apiGet<CurrentUserDto>('/api/me', options)
}
