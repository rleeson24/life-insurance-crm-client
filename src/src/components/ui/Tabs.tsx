import type { ReactNode } from 'react'
import { cn } from '@/lib/format'
import { ui } from '@/lib/uiClasses'

interface TabsProps {
  tabs: Array<{ id: string; label: string }>
  activeTab: string
  onChange: (tabId: string) => void
  children: ReactNode
}

export function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div>
      <div className={ui.tabs.bar} role="tablist" aria-label="Client profile sections">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                ui.tabs.tab,
                isActive ? ui.tabs.active : ui.tabs.inactive,
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
