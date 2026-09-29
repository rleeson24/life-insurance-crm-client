import { apiGet, buildQueryString, type ApiRequestOptions } from '@/api/apiFetch'
import type {
  AuthSecurityEventDto,
  ListAuthSecurityEventsParams,
  ListAuthSecurityEventsResult,
} from '@/types/apiModels'

export function listAuthSecurityEvents(
  params: ListAuthSecurityEventsParams = {},
  options: ApiRequestOptions = {},
) {
  return apiGet<ListAuthSecurityEventsResult>(
    `/api/auth-security-events${buildQueryString({
      search: params.search,
      eventType: params.eventType,
      success: params.success,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    })}`,
    options,
  )
}

export function getAuthSecurityEvent(
  authSecurityEventId: string,
  options: ApiRequestOptions = {},
) {
  return apiGet<AuthSecurityEventDto>(
    `/api/auth-security-events/${authSecurityEventId}`,
    options,
  )
}
