import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
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
  '/admin/users': {
    title: 'Users',
    subtitle: 'Map Entra users to CRM organizations',
  },
  '/admin/plan-names': {
    title: 'Plan names',
    subtitle: 'Manage Medicare, drug, and secondary plan names by year',
  },
  '/admin/import': {
    title: 'Import',
    subtitle: 'Load clients, plans, and contacts from an Access database',
  },
  '/admin/tenants': {
    title: 'Organizations',
    subtitle: 'Create CRM tenants and mark them inactive when they leave',
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

  return pageTitles[pathname] ?? { title: 'BrokerBook' }
}

export function AppShell() {
  const { pathname } = useLocation()
  const meta = getPageMeta(pathname)
  const [openForPath, setOpenForPath] = useState<string | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavOpen = openForPath === pathname

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    function onChange() {
      if (media.matches) setOpenForPath(null)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const closeMobileNav = useCallback(() => {
    setOpenForPath(null)
    menuButtonRef.current?.focus()
  }, [])

  return (
    <div className={`flex min-h-screen ${ui.page.background}`}>
      <Sidebar className="hidden w-64 lg:flex" />
      <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          menuOpen={mobileNavOpen}
          menuButtonRef={menuButtonRef}
          onMenuClick={() => setOpenForPath(pathname)}
        />
        <main className={ui.page.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
