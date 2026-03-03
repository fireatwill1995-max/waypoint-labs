'use client'

import { IconClipboard, IconChat, IconGamepad, IconChip, IconChart, IconCog } from '../UIcons'
import { CIVILIAN_TABS, type CivilianMainTabId } from './constants'

const TAB_ICONS: Record<CivilianMainTabId, React.ComponentType<{ className?: string }>> = {
  plan: IconClipboard,
  chat: IconChat,
  manual: IconGamepad,
  autonomous: IconChip,
  monitoring: IconChart,
  advanced: IconCog,
}

export interface CivilianTabBarProps {
  activeTab: CivilianMainTabId
  onTabChange: (tab: CivilianMainTabId) => void
  onMonitoringOpen?: () => void
}

export function CivilianTabBar({ activeTab, onTabChange, onMonitoringOpen }: CivilianTabBarProps) {
  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CIVILIAN_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id]
          return (
            <button
              key={tab.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onTabChange(tab.id)
                if (tab.id === 'monitoring') {
                  onMonitoringOpen?.()
                }
                setTimeout(() => {
                  document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 cursor-pointer font-futuristic whitespace-nowrap flex items-center gap-1 sm:gap-2 group relative touch-target ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-dji-500 via-dji-400 to-blue-500 text-white shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-dji-500/50 animate-jarvis-glow scale-105'
                  : 'glass-dji border-2 border-dji-500/20 text-dji-400/70 hover:border-dji-500/40 hover:text-dji-300 hover:scale-[1.02]'
              }`}
              style={{ pointerEvents: 'auto', zIndex: 10 }}
              title={`${tab.label} - ${tab.description} (Press ${tab.shortcut})`}
              aria-label={tab.label}
            >
              {Icon && <Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />}
              <span className="text-on-dark hidden sm:inline text-sm sm:text-base">{tab.label}</span>
              <span className="text-xs opacity-70 hidden lg:inline">({tab.shortcut})</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tab.description}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </span>
            </button>
          )
        })}
      </div>
      <div className="h-1 bg-dji-500/20 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-dji-500 to-dji-400 transition-all duration-300 absolute top-0"
          style={{
            width: '16.666%',
            left: `${CIVILIAN_TABS.findIndex((t) => t.id === activeTab) * (100 / 6)}%`,
          }}
        />
      </div>
    </>
  )
}
