import {
  ClipboardList,
  LogIn,
  LogOut,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { AccessDenialReason } from '@/auth/accessError'
import { login, logout } from '@/auth/auth'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

export type WelcomeVariant = 'guest' | AccessDenialReason

interface WelcomePageProps {
  variant: WelcomeVariant
  signedInAs?: string
  signedInEmail?: string
  onRetry?: () => void
}

const highlights = [
  {
    icon: Users,
    title: 'Clients',
    description: 'Search and manage your book of business.',
  },
  {
    icon: ClipboardList,
    title: 'Follow-ups',
    description: 'See who still needs a callback.',
  },
  {
    icon: ShieldCheck,
    title: 'Coverage',
    description: 'Track Major Medical, drug plan, and secondary enrollments.',
  },
] as const

const denialCopy: Record<
  AccessDenialReason,
  { title: string; description: string; showRetry?: boolean }
> = {
  'no-account': {
    title: "You don't have a BrokerBook account yet",
    description:
      "You're signed in, but this Microsoft account isn't set up in BrokerBook. Ask your agency administrator to add you, then try again.",
    showRetry: true,
  },
  'inactive-user': {
    title: 'Your account is inactive',
    description:
      'Your BrokerBook account has been deactivated. Contact your agency administrator if you still need access.',
  },
  'inactive-org': {
    title: 'Your organization is inactive',
    description:
      'This BrokerBook organization is no longer active. Contact your administrator if you believe this is a mistake.',
  },
  'invalid-identity': {
    title: "This Microsoft account can't be used",
    description:
      'BrokerBook requires a work account. Sign out and sign in with the account your administrator provisioned.',
  },
  forbidden: {
    title: "You don't have access",
    description:
      "Your account doesn't have permission to use BrokerBook. Contact your agency administrator.",
  },
  unavailable: {
    title: "Can't reach BrokerBook",
    description:
      "We couldn't load your workspace. Check that the API is running and try again.",
    showRetry: true,
  },
}

export function WelcomePage({
  variant,
  signedInAs,
  signedInEmail,
  onRetry,
}: WelcomePageProps) {
  const isGuest = variant === 'guest'
  const denial = isGuest ? null : denialCopy[variant]
  const identity =
    signedInAs && signedInEmail && signedInAs !== signedInEmail
      ? `${signedInAs} (${signedInEmail})`
      : signedInAs || signedInEmail

  return (
    <div className={cn('flex min-h-screen flex-col', ui.page.background)}>
      <header className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
            )}
          >
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">BrokerBook</p>
            <p className={ui.text.mutedSm}>Advisor workspace</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className={cn('text-sm font-medium', 'text-indigo-600 dark:text-indigo-400')}>
              BrokerBook
            </p>
            <h1 className={cn('mt-3 text-3xl font-semibold tracking-tight sm:text-4xl', ui.text.primary)}>
              Advisor workspace for your book of business
            </h1>
            <p className={cn('mt-4 max-w-md text-base', ui.text.secondary)}>
              Keep clients, follow-ups, and coverage in one place. Access is
              provisioned by your agency — there is no self-serve signup.
            </p>
            <ul className="mt-8 space-y-4">
              {highlights.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <div className={ui.surface.iconAccent}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className={ui.text.itemTitle}>{title}</p>
                    <p className={ui.text.mutedSm}>{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <section className={cn(ui.surface.card, 'p-5 sm:p-8')}>
            {isGuest ? (
              <>
                <h2 className={ui.text.cardTitle}>Sign in to continue</h2>
                <p className={cn('mt-2', ui.text.mutedSm)}>
                  Use your work Microsoft account. If you don't have a
                  BrokerBook account yet, ask your administrator to add you
                  before signing in.
                </p>
                <Button className="mt-6 w-full" onClick={() => void login()}>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in with Microsoft
                </Button>
              </>
            ) : (
              <>
                <h2 className={ui.text.cardTitle}>{denial?.title}</h2>
                <p className={cn('mt-2', ui.text.mutedSm)}>{denial?.description}</p>
                {identity ? (
                  <p className={cn('mt-4 text-sm', ui.text.secondary)}>
                    Signed in as {identity}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col gap-3">
                  {denial?.showRetry && onRetry ? (
                    <Button className="w-full" onClick={onRetry}>
                      Try again
                    </Button>
                  ) : null}
                  <Button
                    className="w-full"
                    variant={denial?.showRetry ? 'secondary' : 'primary'}
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
