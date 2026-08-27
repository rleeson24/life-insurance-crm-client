import type { ReactNode } from 'react'
import { InteractionStatus } from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/api/me'
import { ApiError } from '@/api/apiFetch'
import { classifyAccessError } from '@/auth/accessError'
import { getAuthDisplayName } from '@/auth/auth'
import { Spinner } from '@/components/ui/Spinner'
import { queryKeys } from '@/lib/queryKeys'
import { ui } from '@/lib/uiClasses'
import { WelcomePage } from '@/pages/WelcomePage'

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${ui.page.background}`}>
      <Spinner label={label} />
    </div>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { inProgress, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0]
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: isAuthenticated && inProgress === InteractionStatus.None,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false
      }

      return failureCount < 1
    },
  })

  if (inProgress !== InteractionStatus.None) {
    return <FullPageSpinner label="Signing in" />
  }

  if (!isAuthenticated) {
    return <WelcomePage variant="guest" />
  }

  if (meQuery.isPending) {
    return <FullPageSpinner label="Loading workspace" />
  }

  if (meQuery.isError) {
    return (
      <WelcomePage
        variant={classifyAccessError(meQuery.error)}
        signedInAs={account?.name || getAuthDisplayName()}
        signedInEmail={account?.username}
        onRetry={() => void meQuery.refetch()}
      />
    )
  }

  return children
}
