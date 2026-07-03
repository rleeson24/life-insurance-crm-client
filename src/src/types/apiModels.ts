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

export interface MedicareEnrollmentDto {
  medicareEnrollmentId: string
  clientId: string
  recordedAt: string
  isActivePlan: boolean
  planName?: string | null
  prescriptionDrugPlan?: string | null
  coverageStartDate?: string | null
  isNewEnrollment: boolean
  healthReimbursementArrangement?: string | null
  enrollmentPlatform?: string | null
  enrollmentLocation?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplementalEnrollmentDto {
  supplementalEnrollmentId: string
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
  medicareEnrollments: MedicareEnrollmentDto[]
  supplementalEnrollments: SupplementalEnrollmentDto[]
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

export interface ListClientsParams {
  search?: string
  page?: number
  pageSize?: number
  isActive?: boolean
  isAcaClient?: boolean
}
