import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { getCurrentUser } from '@/api/me'
import {
  exportBookOfBusinessReport,
  exportMailingListReport,
  exportProductionReport,
  exportRetentionReport,
  getBookOfBusinessReport,
  getMailingListReport,
  getProductionReport,
  getRetentionReport,
} from '@/api/reports'
import { ApiError } from '@/api/apiFetch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { downloadCsv, reportFileDate } from '@/lib/csv'
import { formatClientName, formatDate } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { canExportReports } from '@/lib/roles'
import { ui } from '@/lib/uiClasses'
import type {
  BookOfBusinessRowDto,
  MailingListRowDto,
  ProductionReportRowDto,
  RetentionReportRowDto,
} from '@/types/apiModels'

const tabs = [
  { id: 'summary', label: 'Production and retention' },
  { id: 'book', label: 'Book of business' },
  { id: 'mailing', label: 'Mailing list' },
]

const bookPageSize = 50

function currentCalendarYear() {
  return new Date().getFullYear()
}

function yearOptions(selectedYear: number) {
  const current = currentCalendarYear()
  const years: number[] = []
  for (let year = current + 1; year >= current - 10; year -= 1) {
    years.push(year)
  }
  if (!years.includes(selectedYear)) {
    years.push(selectedYear)
    years.sort((a, b) => b - a)
  }
  return years
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

function cell(value?: string | null) {
  return value?.trim() ? value : '—'
}

function exportErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Unable to export the report.'
}

function ExportErrorBanner({ error }: { error: unknown }) {
  if (!error) return null
  return <p className={`mb-4 ${ui.text.errorBanner}`}>{exportErrorMessage(error)}</p>
}

function retentionPercent(row: RetentionReportRowDto) {
  if (row.totalCount === 0) return '—'
  return `${Math.round((row.stillActiveCount / row.totalCount) * 100)}%`
}

function bookCsvRows(items: BookOfBusinessRowDto[]) {
  return items.map((row) => [
    row.firstName,
    row.legalName,
    row.lastName,
    row.primaryPhone,
    row.addressLine1,
    row.addressLine2,
    row.city,
    row.state,
    row.postalCode,
    row.emailAddress,
    row.dateOfBirth,
    row.medicareNumber,
    row.medicarePartAEffectiveDate,
    row.medicarePartBEffectiveDate,
    yesNo(row.hasContactConsent),
    row.notes,
    row.medicarePlanName,
    row.medicareCoverageStartDate,
    row.drugPlanName,
    row.drugCoverageStartDate,
    row.secondaryPlanName,
    row.secondaryCoverageStartDate,
  ])
}

function mailingCsvRows(items: MailingListRowDto[]) {
  return items.map((row) => [
    row.firstName,
    row.legalName,
    row.lastName,
    row.primaryPhone,
    row.addressLine1,
    row.addressLine2,
    row.city,
    row.state,
    row.postalCode,
    row.emailAddress,
    yesNo(row.hasContactConsent),
    row.medicarePlanName,
    row.medicareCoverageStartDate,
    row.enrollmentLocation,
    row.enrollmentPlatform,
  ])
}

const mailingHeaders = [
  'First',
  'Legal name',
  'Last',
  'Phone',
  'Address',
  'Address 2',
  'City',
  'State',
  'Zip',
  'Email',
  'Contact consent',
  'Medicare plan',
  'Medicare start',
  'Enrollment location',
  'Enrollment platform',
]

function formatAddress(row: {
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
}) {
  return (
    [row.addressLine1, row.addressLine2, row.city, row.state, row.postalCode]
      .filter((part) => part?.trim())
      .join(', ') || '—'
  )
}

const bookHeaders = [
  'First',
  'Legal name',
  'Last',
  'Phone',
  'Address',
  'Address 2',
  'City',
  'State',
  'Zip',
  'Email',
  'Date of birth',
  'Medicare number',
  'Part A',
  'Part B',
  'Contact consent',
  'Notes',
  'Medicare plan',
  'Medicare start',
  'Drug plan',
  'Drug start',
  'Secondary plan',
  'Secondary start',
]

function productionCsvRows(
  type: string,
  rows: ProductionReportRowDto[],
): Array<Array<string | number | null | undefined>> {
  return rows.map((row) => [type, row.planName, row.coverageStartDate, row.enrollmentCount])
}

export function ReportsPage() {
  const [tab, setTab] = useState('summary')
  const [planYear, setPlanYear] = useState(currentCalendarYear)
  const [bookPage, setBookPage] = useState(1)
  const [mailingPage, setMailingPage] = useState(1)
  const years = yearOptions(planYear)

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const canExport = canExportReports(meQuery.data?.role)

  const bookQuery = useQuery({
    queryKey: queryKeys.bookOfBusinessReport,
    queryFn: ({ signal }) => getBookOfBusinessReport({ signal }),
    enabled: tab === 'book',
  })
  const mailingQuery = useQuery({
    queryKey: queryKeys.mailingListReport,
    queryFn: ({ signal }) => getMailingListReport({ signal }),
    enabled: tab === 'mailing',
  })
  const productionQuery = useQuery({
    queryKey: queryKeys.productionReport(planYear),
    queryFn: ({ signal }) => getProductionReport(planYear, { signal }),
    enabled: tab === 'summary',
  })
  const retentionQuery = useQuery({
    queryKey: queryKeys.retentionReport,
    queryFn: ({ signal }) => getRetentionReport({ signal }),
    enabled: tab === 'summary',
  })

  const bookItems = bookQuery.data?.items ?? []
  const bookTotalPages = Math.max(1, Math.ceil(bookItems.length / bookPageSize))
  const currentBookPage = Math.min(bookPage, bookTotalPages)
  const pagedBookItems = useMemo(() => {
    const start = (currentBookPage - 1) * bookPageSize
    return bookItems.slice(start, start + bookPageSize)
  }, [bookItems, currentBookPage])

  const mailingItems = mailingQuery.data?.items ?? []
  const mailingTotalPages = Math.max(1, Math.ceil(mailingItems.length / bookPageSize))
  const currentMailingPage = Math.min(mailingPage, mailingTotalPages)
  const pagedMailingItems = useMemo(() => {
    const start = (currentMailingPage - 1) * bookPageSize
    return mailingItems.slice(start, start + bookPageSize)
  }, [mailingItems, currentMailingPage])

  const bookExportMutation = useMutation({
    mutationFn: () => exportBookOfBusinessReport(),
    onSuccess: (report) => {
      downloadCsv(
        `book-of-business-${reportFileDate()}.csv`,
        bookHeaders,
        bookCsvRows(report.items),
      )
    },
  })

  const mailingExportMutation = useMutation({
    mutationFn: () => exportMailingListReport(),
    onSuccess: (report) => {
      downloadCsv(
        `mailing-list-${reportFileDate()}.csv`,
        mailingHeaders,
        mailingCsvRows(report.items),
      )
    },
  })

  const productionExportMutation = useMutation({
    mutationFn: () => exportProductionReport(planYear),
    onSuccess: (report) => {
      downloadCsv(
        `production-${planYear}-${reportFileDate()}.csv`,
        ['Type', 'Plan name', 'Coverage start', 'Enrollment count'],
        [
          ...productionCsvRows('Medicare', report.medicare),
          ...productionCsvRows('Drug', report.drug),
          ...productionCsvRows('Secondary', report.secondary),
        ],
      )
    },
  })

  const retentionExportMutation = useMutation({
    mutationFn: () => exportRetentionReport(),
    onSuccess: (report) => {
      downloadCsv(
        `retention-${reportFileDate()}.csv`,
        ['Year', 'New clients', 'Still active', 'Retention %'],
        report.rows.map((row) => [
          row.firstYear,
          row.totalCount,
          row.stillActiveCount,
          retentionPercent(row),
        ]),
      )
    },
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} ariaLabel="Report sections">
        {tab === 'book' ? (
          <Card
            title="Book of business"
            description="Active clients with an active Medicare plan"
            action={
              canExport ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={bookExportMutation.isPending}
                  onClick={() => bookExportMutation.mutate()}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              ) : null
            }
          >
            <ExportErrorBanner error={bookExportMutation.error} />
            {bookQuery.isLoading ? (
              <SkeletonRows rows={8} />
            ) : bookQuery.isError ? (
              <EmptyState
                title="Unable to load the book of business"
                description="Check that the API is running and try again."
              />
            ) : bookItems.length === 0 ? (
              <EmptyState
                title="No active Medicare clients"
                description="Clients need an active Medicare plan to appear on this report."
              />
            ) : (
              <>
                {bookQuery.data?.truncated ? (
                  <p className={`mb-4 ${ui.text.mutedSm}`}>
                    Showing the first 5,000 rows. Export uses the same cap.
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={ui.table.head}>
                      <tr>
                        {[
                          'Client',
                          'Legal name',
                          'Phone',
                          'Address',
                          'Email',
                          'DOB',
                          'Medicare number',
                          'Part A',
                          'Part B',
                          'Consent',
                          'Notes',
                          'Medicare plan',
                          'Drug plan',
                          'Secondary',
                        ].map((header) => (
                          <th key={header} className="whitespace-nowrap px-3 py-3 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={ui.table.body}>
                      {pagedBookItems.map((row) => (
                        <tr key={row.clientId} className={ui.table.row}>
                          <td className="whitespace-nowrap px-3 py-3">
                            <Link to={`/clients/${row.clientId}`} className={ui.link.item}>
                              {formatClientName(row.firstName, row.lastName, row.legalName)}
                            </Link>
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.legalName)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.primaryPhone)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {formatAddress(row)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.emailAddress)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {formatDate(row.dateOfBirth)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.medicareNumber)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {formatDate(row.medicarePartAEffectiveDate)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {formatDate(row.medicarePartBEffectiveDate)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {yesNo(row.hasContactConsent)}
                          </td>
                          <td className={`max-w-xs truncate px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.notes)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.medicarePlanName)}
                            {row.medicareCoverageStartDate
                              ? ` (${formatDate(row.medicareCoverageStartDate)})`
                              : ''}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.drugPlanName)}
                            {row.drugCoverageStartDate
                              ? ` (${formatDate(row.drugCoverageStartDate)})`
                              : ''}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.secondaryPlanName)}
                            {row.secondaryCoverageStartDate
                              ? ` (${formatDate(row.secondaryCoverageStartDate)})`
                              : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className={`mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${ui.table.footer}`}
                >
                  <p className={ui.text.mutedSm}>
                    {bookItems.length} clients
                    {bookQuery.isFetching ? ' · Refreshing…' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={currentBookPage <= 1}
                      onClick={() => setBookPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <span className={ui.text.mutedSm}>
                      Page {currentBookPage} of {bookTotalPages}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={currentBookPage >= bookTotalPages}
                      onClick={() =>
                        setBookPage((current) => Math.min(bookTotalPages, current + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ) : tab === 'mailing' ? (
          <Card
            title="Mailing list"
            description="Active clients with mailing address and where the Medicare plan was written"
            action={
              canExport ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={mailingExportMutation.isPending}
                  onClick={() => mailingExportMutation.mutate()}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              ) : null
            }
          >
            <ExportErrorBanner error={mailingExportMutation.error} />
            {mailingQuery.isLoading ? (
              <SkeletonRows rows={8} />
            ) : mailingQuery.isError ? (
              <EmptyState
                title="Unable to load the mailing list"
                description="Check that the API is running and try again."
              />
            ) : mailingItems.length === 0 ? (
              <EmptyState
                title="No active clients"
                description="Active clients appear here for mail and outreach."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={ui.table.head}>
                      <tr>
                        {[
                          'Client',
                          'Legal name',
                          'Phone',
                          'Address',
                          'Email',
                          'Consent',
                          'Medicare plan',
                          'Location',
                          'Platform',
                        ].map((header) => (
                          <th key={header} className="whitespace-nowrap px-3 py-3 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={ui.table.body}>
                      {pagedMailingItems.map((row) => (
                        <tr key={row.clientId} className={ui.table.row}>
                          <td className="whitespace-nowrap px-3 py-3">
                            <Link to={`/clients/${row.clientId}`} className={ui.link.item}>
                              {formatClientName(row.firstName, row.lastName, row.legalName)}
                            </Link>
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.legalName)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.primaryPhone)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {formatAddress(row)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.emailAddress)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {yesNo(row.hasContactConsent)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.medicarePlanName)}
                            {row.medicareCoverageStartDate
                              ? ` (${formatDate(row.medicareCoverageStartDate)})`
                              : ''}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.enrollmentLocation)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-3 ${ui.text.secondary}`}>
                            {cell(row.enrollmentPlatform)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className={`mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${ui.table.footer}`}
                >
                  <p className={ui.text.mutedSm}>
                    {mailingItems.length} clients
                    {mailingQuery.isFetching ? ' · Refreshing…' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={currentMailingPage <= 1}
                      onClick={() => setMailingPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <span className={ui.text.mutedSm}>
                      Page {currentMailingPage} of {mailingTotalPages}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={currentMailingPage >= mailingTotalPages}
                      onClick={() =>
                        setMailingPage((current) => Math.min(mailingTotalPages, current + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2">
              <span className={ui.text.label}>Plan year</span>
              <select
                className={`${ui.field.control} w-full sm:w-auto`}
                value={planYear}
                onChange={(event) => setPlanYear(Number(event.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <Card
              title="Production"
              description={`Enrollments with a coverage start in ${planYear}`}
              action={
                canExport ? (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={productionExportMutation.isPending}
                    onClick={() => productionExportMutation.mutate()}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                ) : null
              }
            >
              <ExportErrorBanner error={productionExportMutation.error} />
              {productionQuery.isLoading ? (
                <SkeletonRows rows={6} />
              ) : productionQuery.isError ? (
                <EmptyState
                  title="Unable to load production"
                  description="Check that the API is running and try again."
                />
              ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                  <ProductionTable title="Medicare" rows={productionQuery.data?.medicare ?? []} />
                  <ProductionTable title="Drug plans" rows={productionQuery.data?.drug ?? []} />
                  <ProductionTable title="Secondary" rows={productionQuery.data?.secondary ?? []} />
                </div>
              )}
            </Card>

            <Card
              title="Retention"
              description="First Medicare coverage year versus clients still marked active"
              action={
                canExport ? (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={retentionExportMutation.isPending}
                    onClick={() => retentionExportMutation.mutate()}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                ) : null
              }
            >
              <ExportErrorBanner error={retentionExportMutation.error} />
              {retentionQuery.isLoading ? (
                <SkeletonRows rows={6} />
              ) : retentionQuery.isError ? (
                <EmptyState
                  title="Unable to load retention"
                  description="Check that the API is running and try again."
                />
              ) : (retentionQuery.data?.rows.length ?? 0) === 0 ? (
                <EmptyState
                  title="No retention data"
                  description="Retention is based on Medicare enrollments."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={ui.table.head}>
                      <tr>
                        <th className="px-3 py-3 font-medium">Year</th>
                        <th className="px-3 py-3 font-medium">New clients</th>
                        <th className="px-3 py-3 font-medium">Still active</th>
                        <th className="px-3 py-3 font-medium">Retention</th>
                      </tr>
                    </thead>
                    <tbody className={ui.table.body}>
                      {retentionQuery.data?.rows.map((row) => (
                        <tr key={row.firstYear} className={ui.table.row}>
                          <td className="px-3 py-3">{row.firstYear}</td>
                          <td className={`px-3 py-3 ${ui.text.secondary}`}>{row.totalCount}</td>
                          <td className={`px-3 py-3 ${ui.text.secondary}`}>
                            {row.stillActiveCount}
                          </td>
                          <td className={`px-3 py-3 ${ui.text.secondary}`}>
                            {retentionPercent(row)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  )
}

function ProductionTable({
  title,
  rows,
}: {
  title: string
  rows: ProductionReportRowDto[]
}) {
  return (
    <div>
      <h3 className={ui.text.sectionTitle}>{title}</h3>
      {rows.length === 0 ? (
        <p className={`mt-3 ${ui.text.mutedSm}`}>No enrollments in this year.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={ui.table.head}>
              <tr>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Start</th>
                <th className="px-3 py-3 font-medium">Count</th>
              </tr>
            </thead>
            <tbody className={ui.table.body}>
              {rows.map((row) => (
                <tr
                  key={`${row.planName}-${row.coverageStartDate ?? ''}`}
                  className={ui.table.row}
                >
                  <td className="px-3 py-3">{row.planName}</td>
                  <td className={`px-3 py-3 ${ui.text.secondary}`}>
                    {formatDate(row.coverageStartDate)}
                  </td>
                  <td className={`px-3 py-3 ${ui.text.secondary}`}>{row.enrollmentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
