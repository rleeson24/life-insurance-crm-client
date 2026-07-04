import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  buildQueryString,
} from '@/api/apiFetch'
import type {
  ClientDetailDto,
  ClientDto,
  CreateClientModel,
  ListClientsParams,
  ListClientsResult,
  UpdateClientModel,
} from '@/types/apiModels'

export function listClients(params: ListClientsParams = {}) {
  return apiGet<ListClientsResult>(
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
  return apiGet<ClientDetailDto>(`/api/clients/${clientId}/detail`)
}

export function createClient(model: CreateClientModel) {
  return apiPost<ClientDto>('/api/clients', model)
}

export function updateClient(clientId: string, model: UpdateClientModel) {
  return apiPut<ClientDto>(`/api/clients/${clientId}`, { ...model, clientId })
}

export function deleteClient(clientId: string) {
  return apiDelete(`/api/clients/${clientId}`)
}
