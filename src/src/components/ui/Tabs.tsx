import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

interface TabsProps {
  tabs: Array<{ id: string; label: string }>
  activeTab: string
  onChange: (tabId: string) => void
  children: ReactNode
}

export function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div>
      <div
        className="flex gap-1 border-b border-slate-200"
        role="tablist"
        aria-label="Client profile sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="pt-5" role="tabpanel">
        {children}
      </div>
    </div>
  )
}
