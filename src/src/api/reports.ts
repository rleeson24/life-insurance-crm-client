import { apiGet, apiPost, buildQueryString, type ApiRequestOptions } from '@/api/apiFetch'
import type {
  BookOfBusinessReportDto,
  MailingListReportDto,
  ProductionReportDto,
  RetentionReportDto,
} from '@/types/apiModels'

export function getBookOfBusinessReport(options: ApiRequestOptions = {}) {
  return apiGet<BookOfBusinessReportDto>('/api/reports/book', options)
}

export function getMailingListReport(options: ApiRequestOptions = {}) {
  return apiGet<MailingListReportDto>('/api/reports/mailing', options)
}

export function getProductionReport(planYear: number, options: ApiRequestOptions = {}) {
  return apiGet<ProductionReportDto>(
    `/api/reports/production${buildQueryString({ planYear })}`,
    options,
  )
}

export function getRetentionReport(options: ApiRequestOptions = {}) {
  return apiGet<RetentionReportDto>('/api/reports/retention', options)
}

export function exportBookOfBusinessReport(options: ApiRequestOptions = {}) {
  return apiPost<BookOfBusinessReportDto>('/api/reports/book/export', undefined, options)
}

export function exportMailingListReport(options: ApiRequestOptions = {}) {
  return apiPost<MailingListReportDto>('/api/reports/mailing/export', undefined, options)
}

export function exportProductionReport(planYear: number, options: ApiRequestOptions = {}) {
  return apiPost<ProductionReportDto>(
    `/api/reports/production/export${buildQueryString({ planYear })}`,
    undefined,
    options,
  )
}

export function exportRetentionReport(options: ApiRequestOptions = {}) {
  return apiPost<RetentionReportDto>('/api/reports/retention/export', undefined, options)
}
