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

