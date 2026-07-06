import type { ReactElement } from 'react'

import type { AppState } from '../../../env'
import { ClockIcon, FolderIcon, SettingsIcon } from '../../../shared/icons/Icons'
import { cn } from '../../../shared/lib/cn'
import type { AppView } from '../model/types'

export type SidebarProps = {
  selectedView: AppView
  recentProjects: AppState['recentProjects']
  onViewChange: (view: AppView) => void
  onSelectRecentProject: (path: string) => void
}

const navItems: Array<{ view: AppView; label: string; icon: typeof FolderIcon }> = [
  { view: 'projects', label: 'Projects', icon: FolderIcon },
  { view: 'runs', label: 'Runs', icon: ClockIcon },
  { view: 'settings', label: 'Settings', icon: SettingsIcon }
]

export function Sidebar({
  selectedView,
  recentProjects,
  onViewChange,
  onSelectRecentProject
}: SidebarProps): ReactElement {
  return (
    <aside className="native-sidebar flex min-h-0 flex-col border-r border-line">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent text-white shadow-[0_8px_22px_rgba(10,132,255,0.22)]">
            <FolderIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink/92">Git-Ingest</div>
            <div className="truncate text-[11px] text-muted">AI context workbench</div>
          </div>
        </div>
      </div>
      <section className="px-3 pt-4">
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/36">
          Library
        </div>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const selected = selectedView === item.view

            return (
              <button
                key={item.view}
                className={cn(
                  'flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2 py-0 text-left text-[13px] transition',
                  selected
                    ? 'bg-accent text-white shadow-[0_8px_22px_rgba(10,132,255,0.18)]'
                    : 'text-ink/68 hover:bg-black/[0.04] hover:text-ink'
                )}
                onClick={() => onViewChange(item.view)}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="min-h-0 flex-1 px-3 pt-4">
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/36">
          Recent Projects
        </div>
        <div className="min-h-0 space-y-0.5 overflow-auto">
          {recentProjects.length === 0 ? (
            <p className="px-2 text-[12px] leading-5 text-muted">Recent folders appear after preview or generation.</p>
          ) : null}
          {recentProjects.map((project) => (
            <button
              key={project.path}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition hover:bg-black/[0.035]"
              onClick={() => onSelectRecentProject(project.path)}
              type="button"
            >
              <FolderIcon className="h-4 w-4 shrink-0 text-ink/50" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink/82">{project.name}</div>
                <div className="truncate text-[11px] text-muted">{project.path}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
