import { apiFetch } from '@/api/apiFetch'
import type { FollowUpInteractionDto } from '@/types/apiModels'

export function listFollowUps() {
  return apiFetch<FollowUpInteractionDto[]>('/api/follow-ups')
}
