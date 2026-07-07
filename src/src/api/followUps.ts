import { apiGet, type ApiRequestOptions } from '@/api/apiFetch'
import type { FollowUpInteractionDto } from '@/types/apiModels'

export function listFollowUps(options: ApiRequestOptions = {}) {
  return apiGet<FollowUpInteractionDto[]>('/api/follow-ups', options)
}
