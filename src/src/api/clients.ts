import { apiFetch, buildQueryString } from '@/api/apiFetch'
import type {
  ClientDetailDto,
  ClientDto,
  CreateClientModel,
  ListClientsParams,
  ListClientsResult,
} from '@/types/apiModels'

export function listClients(params: ListClientsParams = {}) {
  return apiFetch<ListClientsResult>(
    `/api/clients${buildQueryString({
      search: params.search,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
      isActive: params.isActive,
      isAcaClient: params.isAcaClient,
    })}`,
  )
}

export function getClientDetail(clientId: string) {
  return apiFetch<ClientDetailDto>(`/api/clients/${clientId}/detail`)
}

export function createClient(model: CreateClientModel) {
  return apiFetch<ClientDto>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(model),
  })
}
