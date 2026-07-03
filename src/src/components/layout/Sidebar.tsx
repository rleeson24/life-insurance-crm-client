import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Shield } from 'lucide-react'
import { cn } from '@/lib/format'
import { getAuthDisplayName, isDevelopmentAuth } from '@/auth/auth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
]

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Life Insurance CRM</p>
          <p className="text-xs text-slate-400">Advisor workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-xs font-medium text-slate-300">{getAuthDisplayName()}</p>
        {isDevelopmentAuth ? (
          <p className="mt-1 text-xs text-slate-500">Dev auth enabled</p>
        ) : null}
      </div>
    </aside>
  )
}
