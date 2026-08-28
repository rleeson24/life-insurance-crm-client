import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  LogOut,
  Users,
  Shield,
  UserCog,
  Building2,
  X,
} from 'lucide-react'
import { useMsal } from '@azure/msal-react'
import { getCurrentUser } from '@/api/me'
import { getAuthDisplayName, logout } from '@/auth/auth'
import { cn } from '@/lib/format'
import { queryKeys } from '@/lib/queryKeys'
import { canManageOrganizationUsers, isSuperAdmin } from '@/lib/roles'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
  onClose?: () => void
}

export function Sidebar({ className, onNavigate, onClose }: SidebarProps) {
  const { accounts } = useMsal()
  const displayName = accounts[0]?.name || accounts[0]?.username || getAuthDisplayName()
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  })
  const canManageUsers = canManageOrganizationUsers(meQuery.data?.role)
  const platformOperator = isSuperAdmin(meQuery.data?.role)
  const tenantName = meQuery.data?.tenantName?.trim() || 'BrokerBook'

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100',
        className,
      )}
    >
      <div className="relative overflow-hidden border-b border-slate-800 px-5 py-5">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/25 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={tenantName}>
              {tenantName}
            </p>
            <p className="text-xs text-slate-400">Advisor workspace</p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation menu"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Workspace">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-200'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        {canManageUsers ? (
          <NavLink
            to="/admin/users"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-200'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              )
            }
          >
            <UserCog className="h-4 w-4" />
            Users
          </NavLink>
        ) : null}
        {platformOperator ? (
          <NavLink
            to="/admin/tenants"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-200'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              )
            }
          >
            <Building2 className="h-4 w-4" />
            Organizations
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-slate-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="truncate text-xs font-medium text-slate-300">{displayName}</p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
          onClick={() => void logout()}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
