import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, reportFileDate } from '@/lib/csv'

describe('reportFileDate', () => {
  it('formats a local date as yyyy-mm-dd', () => {
    expect(reportFileDate(new Date(2026, 8, 8))).toBe('2026-09-08')
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('escapes CSV cells and clicks a download link', async () => {
    let downloaded: Blob | undefined
    const createObjectURL = vi.fn((value: Blob) => {
      downloaded = value
      return 'blob:csv'
    })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const click = vi.fn()
    const link = { href: '', download: '', click } as unknown as HTMLAnchorElement
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(link)

    downloadCsv(
      'book.csv',
      ['Name', 'Note'],
      [
        ['Jane, Doe', 'said "hello"'],
        [null, undefined],
      ],
    )

    expect(createElement).toHaveBeenCalledWith('a')
    expect(link.download).toBe('book.csv')
    expect(link.href).toBe('blob:csv')
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
    expect(downloaded).toBeInstanceOf(Blob)
    expect(downloaded?.type).toBe('text/csv;charset=utf-8;')
    const csv = await downloaded!.text()
    expect(csv).toContain('Name,Note')
    expect(csv).toContain('"Jane, Doe"')
    expect(csv).toContain('"said ""hello"""')
  })
})
