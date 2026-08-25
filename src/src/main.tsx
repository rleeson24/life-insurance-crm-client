import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import { AuthGate } from '@/auth/AuthGate'
import { initializeMsal, msalInstance } from '@/auth/auth'
import { ThemeProvider } from '@/lib/theme'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

async function start(): Promise<void> {
  await initializeMsal()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthGate>
                <App />
              </AuthGate>
            </BrowserRouter>
          </QueryClientProvider>
        </ThemeProvider>
      </MsalProvider>
    </StrictMode>,
  )
}

void start()
