import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  CreateSupplementalEnrollmentModel,
  SupplementalEnrollmentDto,
  UpdateSupplementalEnrollmentModel,
} from '@/types/apiModels'

export function createSupplementalEnrollment(
  clientId: string,
  model: CreateSupplementalEnrollmentModel,
) {
  return apiPost<SupplementalEnrollmentDto>(
    `/api/clients/${clientId}/supplemental-enrollments`,
    model,
  )
}

export function updateSupplementalEnrollment(
  clientId: string,
  enrollmentId: string,
  model: UpdateSupplementalEnrollmentModel,
) {
  return apiPut<SupplementalEnrollmentDto>(
    `/api/clients/${clientId}/supplemental-enrollments/${enrollmentId}`,
    model,
  )
}

export function deleteSupplementalEnrollment(
  clientId: string,
  enrollmentId: string,
) {
  return apiDelete(
    `/api/clients/${clientId}/supplemental-enrollments/${enrollmentId}`,
  )
}
