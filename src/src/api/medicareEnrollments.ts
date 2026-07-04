import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  CreateMedicareEnrollmentModel,
  MedicareEnrollmentDto,
  UpdateMedicareEnrollmentModel,
} from '@/types/apiModels'

export function createMedicareEnrollment(
  clientId: string,
  model: CreateMedicareEnrollmentModel,
) {
  return apiPost<MedicareEnrollmentDto>(
    `/api/clients/${clientId}/medicare-enrollments`,
    model,
  )
}

export function updateMedicareEnrollment(
  clientId: string,
  enrollmentId: string,
  model: UpdateMedicareEnrollmentModel,
) {
  return apiPut<MedicareEnrollmentDto>(
    `/api/clients/${clientId}/medicare-enrollments/${enrollmentId}`,
    model,
  )
}

export function deleteMedicareEnrollment(clientId: string, enrollmentId: string) {
  return apiDelete(
    `/api/clients/${clientId}/medicare-enrollments/${enrollmentId}`,
  )
}
