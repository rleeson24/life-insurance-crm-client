import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  ClientInteractionDto,
  CreateClientInteractionModel,
  UpdateClientInteractionModel,
} from '@/types/apiModels'

export function createClientInteraction(
  clientId: string,
  model: CreateClientInteractionModel,
) {
  return apiPost<ClientInteractionDto>(
    `/api/clients/${clientId}/interactions`,
    model,
  )
}

export function updateClientInteraction(
  clientId: string,
  interactionId: string,
  model: UpdateClientInteractionModel,
) {
  return apiPut<ClientInteractionDto>(
    `/api/clients/${clientId}/interactions/${interactionId}`,
    model,
  )
}

export function deleteClientInteraction(clientId: string, interactionId: string) {
  return apiDelete(`/api/clients/${clientId}/interactions/${interactionId}`)
}
