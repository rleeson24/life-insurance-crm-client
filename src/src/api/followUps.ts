import { apiGet } from '@/api/apiFetch'
import type { FollowUpInteractionDto } from '@/types/apiModels'

export function listFollowUps() {
  return apiGet<FollowUpInteractionDto[]>('/api/follow-ups')
}
