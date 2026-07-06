import type { ReactElement } from 'react'

import { PlayIcon, SearchIcon, ShieldIcon, SidebarIcon } from '../../../shared/icons/Icons'
import { Button } from '../../../shared/ui/Button'

export type AppChromeProps = {
  isGenerating: boolean
  canGenerate: boolean
  onGenerate: () => void
}

export function AppChrome({ isGenerating, canGenerate, onGenerate }: AppChromeProps): ReactElement {
  return (
    <header
      className="native-toolbar grid h-[52px] grid-cols-[260px_1fr_340px] border-b border-line"
      data-electron-drag-region
    >
      <div className="flex items-center gap-3 px-4" data-electron-drag-region>
        <div className="flex items-center gap-2" data-electron-drag-region>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <button
          aria-label="Toggle sidebar"
          className="ml-2 flex h-7 w-7 items-center justify-center rounded-[8px] p-0 text-ink/58 transition hover:bg-black/[0.04] hover:text-ink"
          type="button"
        >
          <SidebarIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-center gap-3 px-4" data-electron-drag-region>
        <div className="min-w-0 text-center leading-none" data-electron-drag-region>
          <div className="truncate text-[13px] font-semibold text-ink/92">Git-Ingest</div>
          <div className="mt-1 truncate text-[11px] text-muted">Project -&gt; Filter -&gt; Generate -&gt; Export</div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-3" data-electron-drag-region>
        <div className="hidden h-8 items-center gap-2 rounded-[9px] border border-line bg-black/[0.035] px-2.5 text-xs text-muted xl:flex">
          <SearchIcon className="h-3.5 w-3.5" />
          <span>Command</span>
          <kbd className="rounded bg-black/[0.055] px-1.5 py-0.5 text-[10px] text-ink/72">Cmd K</kbd>
        </div>
        <div className="hidden h-8 items-center gap-1.5 rounded-[9px] border border-success/20 bg-success-soft px-2.5 text-xs font-medium text-success-strong lg:flex">
          <ShieldIcon className="h-3.5 w-3.5" />
          Local
        </div>
        <Button
          disabled={!canGenerate || isGenerating}
          leftIcon={<PlayIcon className="h-3.5 w-3.5" />}
          onClick={onGenerate}
          size="sm"
          variant="primary"
        >
          {isGenerating ? 'Running' : 'Generate'}
        </Button>
      </div>
    </header>
  )
}
