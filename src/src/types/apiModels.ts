export interface ApiProblemDetails {
  title?: string
  detail?: string
  status?: number
  type?: string
  errorCode?: string
}

export interface ClientDto {
  clientId: string
  firstName?: string | null
  lastName?: string | null
  legalName?: string | null
  householdName?: string | null
  primaryPhone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  emailAddress?: string | null
  dateOfBirth?: string | null
  medicareNumber?: string | null
  medicarePartAEffectiveDate?: string | null
  medicarePartBEffectiveDate?: string | null
  isActive: boolean
  isAcaClient: boolean
  hasContactConsent: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientSummaryDto {
  clientId: string
  firstName?: string | null
  lastName?: string | null
  legalName?: string | null
  primaryPhone?: string | null
  isActive: boolean
  isAcaClient: boolean
  activePlanName?: string | null
  lastContactedAt?: string | null
  updatedAt: string
}

export interface ListClientsResult {
  items: ClientSummaryDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface FollowUpInteractionDto {
  clientInteractionId: string
  clientId: string
  clientFirstName?: string | null
  clientLastName?: string | null
  contactedAt: string
  summary?: string | null
  requiresFollowUp: boolean
}

export interface ClientInteractionDto {
  clientInteractionId: string
  clientId: string
  contactedAt: string
  summary?: string | null
  notes?: string | null
  requiresFollowUp: boolean
  createdAt: string
  updatedAt: string
}

export interface MajorMedicalEnrollmentDto {
  majorMedicalEnrollmentId: string
  clientId: string
  recordedAt: string
  isActivePlan: boolean
  planName?: string | null
  coverageStartDate?: string | null
  isNewEnrollment: boolean
  healthReimbursementArrangement: boolean
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface DrugPlanEnrollmentDto {
  drugPlanEnrollmentId: string
  clientId: string
  recordedAt: string
  isActivePlan: boolean
  planName?: string | null
  coverageStartDate?: string | null
  isNewEnrollment: boolean
  healthReimbursementArrangement: boolean
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SecondaryEnrollmentDto {
  secondaryEnrollmentId: string
  clientId: string
  recordedAt: string
  planOrCarrierName?: string | null
  coverageStartDate?: string | null
  isActiveCoverage: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientDetailDto {
  client: ClientDto
  interactions: ClientInteractionDto[]
  majorMedicalEnrollments: MajorMedicalEnrollmentDto[]
  drugPlanEnrollments: DrugPlanEnrollmentDto[]
  secondaryEnrollments: SecondaryEnrollmentDto[]
}

export interface CreateClientModel {
  firstName?: string | null
  lastName?: string | null
  legalName?: string | null
  householdName?: string | null
  primaryPhone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  emailAddress?: string | null
  dateOfBirth?: string | null
  medicareNumber?: string | null
  medicarePartAEffectiveDate?: string | null
  medicarePartBEffectiveDate?: string | null
  isActive?: boolean
  isAcaClient?: boolean
  hasContactConsent?: boolean
  notes?: string | null
}

export interface UpdateClientModel extends CreateClientModel {
  clientId: string
}

export interface CreateMajorMedicalEnrollmentModel {
  recordedAt: string
  isActivePlan: boolean
  planName?: string | null
  coverageStartDate?: string | null
  isNewEnrollment: boolean
  healthReimbursementArrangement: boolean
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
}

export interface UpdateMajorMedicalEnrollmentModel extends CreateMajorMedicalEnrollmentModel {}

export interface CreateDrugPlanEnrollmentModel {
  recordedAt: string
  isActivePlan: boolean
  planName?: string | null
  coverageStartDate?: string | null
  isNewEnrollment: boolean
  healthReimbursementArrangement: boolean
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
}

export interface UpdateDrugPlanEnrollmentModel extends CreateDrugPlanEnrollmentModel {}

export interface CreateSecondaryEnrollmentModel {
  recordedAt: string
  planOrCarrierName?: string | null
  coverageStartDate?: string | null
  isActiveCoverage: boolean
  notes?: string | null
}

export interface UpdateSecondaryEnrollmentModel extends CreateSecondaryEnrollmentModel {}

export interface CreateClientInteractionModel {
  contactedAt: string
  summary?: string | null
  notes?: string | null
  requiresFollowUp: boolean
}

export interface UpdateClientInteractionModel extends CreateClientInteractionModel {}

export interface ListClientsParams {
  search?: string
  page?: number
  pageSize?: number
  isActive?: boolean
  isAcaClient?: boolean
}

export interface CurrentUserDto {
  userId: string
  email?: string | null
  tenantId: string
  tenantName?: string | null
  role: string
}

export interface OrganizationUserDto {
  organizationUserId: string
  tenantId: string
  tenantName?: string | null
  userId: string
  emailAddress?: string | null
  displayName?: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationUserModel {
  userId: string
  emailAddress?: string | null
  displayName: string
  role: string
  tenantId?: string | null
}

export interface UpdateOrganizationUserModel {
  emailAddress?: string | null
  displayName: string
  role: string
  isActive: boolean
}

export interface TenantDto {
  tenantId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTenantModel {
  name: string
}

export interface UpdateTenantModel {
  name?: string | null
  isActive?: boolean | null
}

export type PlanNameKind = 'medicare' | 'drug' | 'secondary'

export interface PlanNameDto {
  planNameId: string
  planYear: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreatePlanNameModel {
  planYear: number
  name: string
}

export interface UpdatePlanNameModel {
  name: string
}

export interface ClonePlanNamesModel {
  sourceYear: number
  targetYear: number
}

export interface ClonePlanNamesResultDto {
  sourceCount: number
  clonedCount: number
  skippedCount: number
  items: PlanNameDto[]
}

export type AccessRow = Record<string, unknown>

export interface AccessImportModel {
  clients: AccessRow[]
  medEnrollments: AccessRow[]
  otherEnrollments: AccessRow[]
  contacts: AccessRow[]
  /** Minutes to add to local time to get UTC (`Date#getTimezoneOffset()`). */
  timeZoneOffsetMinutes?: number
}

export interface AccessImportResultDto {
  clientsInserted: number
  majorMedicalEnrollmentsInserted: number
  drugPlanEnrollmentsInserted: number
  secondaryEnrollmentsInserted: number
  interactionsInserted: number
  medicarePlanNamesInserted: number
  drugPlanNamesInserted: number
  secondaryPlanNamesInserted: number
  warnings: string[]
}

