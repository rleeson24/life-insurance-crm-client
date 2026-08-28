import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  buildQueryString,
  type ApiRequestOptions,
} from '@/api/apiFetch'
import type {
  ClonePlanNamesModel,
  ClonePlanNamesResultDto,
  CreatePlanNameModel,
  PlanNameDto,
  PlanNameKind,
  UpdatePlanNameModel,
} from '@/types/apiModels'

export function listPlanNames(
  kind: PlanNameKind,
  year: number,
  options: ApiRequestOptions = {},
) {
  return apiGet<PlanNameDto[]>(
    `/api/plan-names/${kind}${buildQueryString({ year })}`,
    options,
  )
}

export function lookupPlanNames(
  kind: PlanNameKind,
  fromYear: number,
  toYear: number,
  options: ApiRequestOptions = {},
) {
  return apiGet<PlanNameDto[]>(
    `/api/plan-names/${kind}/lookup${buildQueryString({ fromYear, toYear })}`,
    options,
  )
}

export function createPlanName(kind: PlanNameKind, model: CreatePlanNameModel) {
  return apiPost<PlanNameDto>(`/api/plan-names/${kind}`, model)
}

export function updatePlanName(
  kind: PlanNameKind,
  planNameId: string,
  model: UpdatePlanNameModel,
) {
  return apiPut<PlanNameDto>(`/api/plan-names/${kind}/${planNameId}`, model)
}

export function deletePlanName(kind: PlanNameKind, planNameId: string) {
  return apiDelete(`/api/plan-names/${kind}/${planNameId}`)
}

export function clonePlanNames(kind: PlanNameKind, model: ClonePlanNamesModel) {
  return apiPost<ClonePlanNamesResultDto>(`/api/plan-names/${kind}/clone`, model)
}
