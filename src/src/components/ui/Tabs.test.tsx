import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Tabs } from '@/components/ui/Tabs'

function TabsHarness() {
  const [tab, setTab] = useState('summary')
  return (
    <Tabs
      tabs={[
        { id: 'summary', label: 'Production and retention' },
        { id: 'book', label: 'Book of business' },
      ]}
      activeTab={tab}
      onChange={setTab}
      ariaLabel="Report sections"
    >
      {tab === 'book' ? <p>Book panel</p> : <p>Summary panel</p>}
    </Tabs>
  )
}

describe('Tabs', () => {
  it('switches the selected tab', async () => {
    const user = userEvent.setup()
    render(<TabsHarness />)

    expect(screen.getByText('Summary panel')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Book of business' }))
    expect(screen.getByText('Book panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Book of business' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
