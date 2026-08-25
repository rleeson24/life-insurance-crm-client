import { useEffect, useRef, type ReactNode } from 'react'
import { InteractionStatus } from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { login } from '@/auth/auth'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ui } from '@/lib/uiClasses'

export function AuthGate({ children }: { children: ReactNode }) {
  const { inProgress, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const loginStarted = useRef(false)

  useEffect(() => {
    if (
      inProgress === InteractionStatus.None &&
      !isAuthenticated &&
      accounts.length === 0 &&
      !loginStarted.current
    ) {
      loginStarted.current = true
      void login()
    }
  }, [accounts.length, inProgress, isAuthenticated])

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${ui.page.background}`}>
        <Spinner label="Signing in" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${ui.page.background}`}>
        <div className={`${ui.surface.card} w-full max-w-md p-8 text-center`}>
          <h1 className={ui.text.cardTitle}>Life Insurance CRM</h1>
          <p className={`mt-2 ${ui.text.mutedSm}`}>Sign in with your work account to continue.</p>
          <Button className="mt-6 w-full" onClick={() => void login()}>
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return children
}
