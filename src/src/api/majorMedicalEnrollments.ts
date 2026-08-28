import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  CreateMajorMedicalEnrollmentModel,
  MajorMedicalEnrollmentDto,
  UpdateMajorMedicalEnrollmentModel,
} from '@/types/apiModels'

export function createMajorMedicalEnrollment(
  clientId: string,
  model: CreateMajorMedicalEnrollmentModel,
) {
  return apiPost<MajorMedicalEnrollmentDto>(
    `/api/clients/${clientId}/major-medical-enrollments`,
    model,
  )
}

export function updateMajorMedicalEnrollment(
  clientId: string,
  enrollmentId: string,
  model: UpdateMajorMedicalEnrollmentModel,
) {
  return apiPut<MajorMedicalEnrollmentDto>(
    `/api/clients/${clientId}/major-medical-enrollments/${enrollmentId}`,
    model,
  )
}

export function deleteMajorMedicalEnrollment(clientId: string, enrollmentId: string) {
  return apiDelete(
    `/api/clients/${clientId}/major-medical-enrollments/${enrollmentId}`,
  )
}
