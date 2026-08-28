import { apiDelete, apiPost, apiPut } from '@/api/apiFetch'
import type {
  CreateDrugPlanEnrollmentModel,
  DrugPlanEnrollmentDto,
  UpdateDrugPlanEnrollmentModel,
} from '@/types/apiModels'

export function createDrugPlanEnrollment(
  clientId: string,
  model: CreateDrugPlanEnrollmentModel,
) {
  return apiPost<DrugPlanEnrollmentDto>(
    `/api/clients/${clientId}/drug-plan-enrollments`,
    model,
  )
}

export function updateDrugPlanEnrollment(
  clientId: string,
  enrollmentId: string,
  model: UpdateDrugPlanEnrollmentModel,
) {
  return apiPut<DrugPlanEnrollmentDto>(
    `/api/clients/${clientId}/drug-plan-enrollments/${enrollmentId}`,
    model,
  )
}

export function deleteDrugPlanEnrollment(clientId: string, enrollmentId: string) {
  return apiDelete(
    `/api/clients/${clientId}/drug-plan-enrollments/${enrollmentId}`,
  )
}
