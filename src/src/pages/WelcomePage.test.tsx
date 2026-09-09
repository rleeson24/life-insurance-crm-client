import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { WelcomePage } from '@/pages/WelcomePage'
import { ThemeProvider } from '@/lib/theme'

vi.mock('@/auth/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))

import { login, logout } from '@/auth/auth'

function renderWelcome(props: ComponentProps<typeof WelcomePage>) {
  return render(
    <ThemeProvider>
      <WelcomePage {...props} />
    </ThemeProvider>,
  )
}

describe('WelcomePage', () => {
  it('prompts guests to sign in with Microsoft', async () => {
    const user = userEvent.setup()
    renderWelcome({ variant: 'guest' })

    expect(
      screen.getByRole('heading', { name: /advisor workspace for your book of business/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /sign in with microsoft/i }))
    expect(login).toHaveBeenCalledOnce()
  })

  it('explains a missing BrokerBook account and retries', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderWelcome({
      variant: 'no-account',
      signedInAs: 'Jane Doe',
      signedInEmail: 'jane@contoso.com',
      onRetry,
    })

    expect(
      screen.getByRole('heading', { name: /don't have a brokerbook account/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/signed in as jane doe \(jane@contoso.com\)/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(logout).toHaveBeenCalledOnce()
  })
})
