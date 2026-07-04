import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ui } from '@/lib/uiClasses'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Overview of clients and follow-ups',
  },
  '/clients': {
    title: 'Clients',
    subtitle: 'Search and manage your book of business',
  },
  '/clients/new': {
    title: 'New Client',
    subtitle: 'Add a new client record',
  },
}

function getPageMeta(pathname: string) {
  if (pathname.endsWith('/edit') && pathname.startsWith('/clients/')) {
    return {
      title: 'Edit Client',
      subtitle: 'Update client details or remove the record',
    }
  }

  if (pathname.startsWith('/clients/') && pathname !== '/clients/new') {
    return {
      title: 'Client Profile',
      subtitle: 'Review client details, activity, and coverage',
    }
  }

  return pageTitles[pathname] ?? { title: 'Life Insurance CRM' }
}

export function AppShell() {
  const { pathname } = useLocation()
  const meta = getPageMeta(pathname)

  return (
    <div className={`flex min-h-screen ${ui.page.background}`}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
