import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  CreateSecondaryEnrollmentModel,
  SecondaryEnrollmentDto,
  UpdateSecondaryEnrollmentModel,
} from '@/types/apiModels'

export function createSecondaryEnrollment(
  clientId: string,
  model: CreateSecondaryEnrollmentModel,
) {
  return apiPost<SecondaryEnrollmentDto>(
    `/api/clients/${clientId}/secondary-enrollments`,
    model,
  )
}

export function updateSecondaryEnrollment(
  clientId: string,
  enrollmentId: string,
  model: UpdateSecondaryEnrollmentModel,
) {
  return apiPut<SecondaryEnrollmentDto>(
    `/api/clients/${clientId}/secondary-enrollments/${enrollmentId}`,
    model,
  )
}

export function deleteSecondaryEnrollment(
  clientId: string,
  enrollmentId: string,
) {
  return apiDelete(
    `/api/clients/${clientId}/secondary-enrollments/${enrollmentId}`,
  )
}
