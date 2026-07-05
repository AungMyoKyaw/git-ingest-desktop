# Native Light Desktop UI Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Git-Ingest Electron renderer as a modern light native desktop app while preserving the existing secure IPC workflow and upgrading dependencies to current compatible versions.

**Architecture:** Keep main-process IPC and core ingestion logic intact. Move renderer behavior into a thin `App.tsx` coordinator, pure model helpers, focused feature UI components, shared UI primitives, local icons, and a Tailwind 4-backed light native style system.

**Tech Stack:** Bun workspaces, TypeScript, React 19, Electron, electron-vite, Vite, Tailwind CSS 4, Vitest, Playwright smoke tests.

---

## Source Material

- Design spec: `docs/superpowers/specs/2026-07-05-native-light-desktop-ui-rewrite-design.md`
- Existing renderer entry: `packages/desktop/src/renderer/src/App.tsx`
- Existing renderer styles: `packages/desktop/src/renderer/src/styles.css`
- Existing preload API types: `packages/desktop/src/renderer/src/env.d.ts`
- Existing Electron config: `packages/desktop/electron.vite.config.ts`
- Reference UI project: `/Users/aungmyokyaw/Downloads/git-ingest-light-native-desktop-ui`

## File Map

- Modify: `package.json`
  - Update root dev dependencies to current compatible versions.
- Modify: `packages/core/package.json`
  - Update `minimatch`.
- Modify: `packages/cli/package.json`
  - Update `clipboardy`.
- Modify: `packages/desktop/package.json`
  - Update React/Electron/Vite toolchain and add Tailwind CSS 4 dependencies.
- Modify: `bun.lock`
  - Refresh after dependency changes.
- Modify: `packages/desktop/electron.vite.config.ts`
  - Add Tailwind CSS 4 Vite plugin to renderer config.
- Create: `packages/desktop/src/renderer/src/features/ingest/model/view-model.ts`
  - Pure formatting, derived status, and view-model helpers.
- Create: `packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts`
  - Tests for formatting and data mapping.
- Create: `packages/desktop/src/renderer/src/features/ingest/model/types.ts`
  - Renderer-only UI state and run-history types.
- Create: `packages/desktop/src/renderer/src/shared/lib/cn.ts`
  - Small class-name join helper.
- Create: `packages/desktop/src/renderer/src/shared/icons/Icons.tsx`
  - Local SVG icons used by the renderer.
- Create: `packages/desktop/src/renderer/src/shared/ui/Button.tsx`
  - Shared native-style button primitive.
- Create: `packages/desktop/src/renderer/src/shared/ui/MetricCard.tsx`
  - Shared metric display.
- Create: `packages/desktop/src/renderer/src/shared/ui/SegmentedControl.tsx`
  - Shared segmented control.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/AppChrome.tsx`
  - Native toolbar.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Sidebar.tsx`
  - Navigation and recent projects.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Inspector.tsx`
  - Metrics, safety, warnings, actions, and errors.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/StatusBar.tsx`
  - Bottom status strip.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/RulesSheet.tsx`
  - Advanced rules editor.
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Workspace.tsx`
  - Projects, runs, and settings views.
- Modify: `packages/desktop/src/renderer/src/App.tsx`
  - Replace single-file UI with real state coordinator and new components.
- Modify: `packages/desktop/src/renderer/src/styles.css`
  - Replace dark styles with Tailwind 4 import and native light CSS layer.

## Dependency Targets

Before implementation, re-run:

```bash
bunx npm-check-updates --jsonUpgraded --target latest
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/desktop
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/core
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/cli
```

Expected based on the 2026-07-05 review:

- Root: `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `vitest`.
- Desktop: `react`, `react-dom`, `@vitejs/plugin-react`, `electron`, `electron-builder`, `electron-vite`, `playwright`, `vite`.
- Core: `minimatch`.
- CLI: `clipboardy`.
- Add desktop dev dependencies: `tailwindcss`, `@tailwindcss/vite`.

If a latest major version fails, keep the newest compatible version and document the exact command/output in the task commit message body.

---

### Task 1: Modernize Dependencies And Tailwind Vite Setup

**Files:**

- Modify: `package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/desktop/package.json`
- Modify: `packages/desktop/electron.vite.config.ts`
- Modify: `bun.lock`

- [ ] **Step 1: Re-check current package updates**

Run:

```bash
bunx npm-check-updates --jsonUpgraded --target latest
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/desktop
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/core
bunx npm-check-updates --jsonUpgraded --target latest --cwd packages/cli
```

Expected: JSON maps of available upgrades. Save the versions mentally for the next step; do not edit from stale versions if the output differs from this plan.

- [ ] **Step 2: Update package manifests**

Update the manifests to the latest compatible versions reported by Step 1. Also add Tailwind CSS 4 dependencies to `packages/desktop/package.json`.

The desktop dev dependency block should include these package names after editing:

```json
{
  "@tailwindcss/vite": "^4.3.2",
  "@vitejs/plugin-react": "^6.0.3",
  "electron": "^43.0.0",
  "electron-builder": "^26.15.3",
  "electron-vite": "^5.0.0",
  "playwright": "^1.61.1",
  "tailwindcss": "^4.3.2",
  "vite": "^8.1.3"
}
```

If Step 1 reports newer versions, use those newer versions.

- [ ] **Step 3: Install and refresh lockfile**

Run:

```bash
bun install
```

Expected: `bun.lock` changes and installation succeeds with exit code 0.

- [ ] **Step 4: Configure Tailwind CSS 4 for electron-vite**

Edit `packages/desktop/electron.vite.config.ts` to include Tailwind's Vite plugin for the renderer:

```ts
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react(), tailwindcss()]
  }
})
```

- [ ] **Step 5: Run baseline verification**

Run:

```bash
bun test
bun run build:desktop
```

Expected: both commands pass. If TypeScript 6 or toolchain upgrades produce type errors unrelated to the renderer rewrite, fix only the minimal compatibility issues needed to restore the baseline.

- [ ] **Step 6: Commit**

Run:

```bash
git status --short
git add package.json packages/core/package.json packages/cli/package.json packages/desktop/package.json packages/desktop/electron.vite.config.ts bun.lock
git commit -m "chore(deps): modernize desktop toolchain"
```

Expected: one dependency/setup commit.

---

### Task 2: Add Renderer View-Model Helpers With Tests

**Files:**

- Create: `packages/desktop/src/renderer/src/features/ingest/model/types.ts`
- Create: `packages/desktop/src/renderer/src/features/ingest/model/view-model.ts`
- Create: `packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts`
- Modify: `packages/desktop/package.json`

- [ ] **Step 1: Add renderer model types**

Create `packages/desktop/src/renderer/src/features/ingest/model/types.ts`:

```ts
import type { DesktopError, GenerateResult, PreviewResult } from '../../../env'

export type AppView = 'projects' | 'runs' | 'settings'

export type RunRecord = {
  id: string
  projectName: string
  createdAt: string
  tokenCount: number
  outputBytes: number
  status: 'success' | 'cancelled' | 'error'
}

export type RulesDraft = {
  format: 'markdown' | 'text'
  maxFileSizeMb: string
  includeInput: string
  excludeInput: string
  includePatterns: string[]
  excludePatterns: string[]
}

export type FeedbackState = {
  message: string
  error: DesktopError | null
}

export type IngestSnapshot = {
  folderPath: string
  preview: PreviewResult | null
  generated: GenerateResult | null
  savedFilePath: string | null
  phase: string
  busy: boolean
  activeRequestId: string | null
}
```

- [ ] **Step 2: Add failing helper tests**

Create `packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  bytesToMegabytes,
  formatBytes,
  makeRequestKey,
  projectNameFromPath,
  toPreviewMetrics
} from './view-model'
import type { PreviewResult } from '../../../env'

const preview: PreviewResult = {
  projectName: 'git-ingest',
  rootDir: '/tmp/git-ingest',
  totalFiles: 5,
  includedFiles: [
    { relativePath: 'README.md', size: 1000, label: 'Markdown', language: 'Markdown' },
    { relativePath: 'src/App.tsx', size: 2000, label: 'TypeScript', language: 'TypeScript' }
  ],
  skippedFiles: [{ relativePath: 'dist/app.js', reason: 'ignored' }],
  ignoredDirectories: [{ path: 'node_modules', reason: 'default ignore' }],
  fileTypes: [{ label: 'TypeScript', count: 1, percentage: 50 }],
  estimatedTokenCount: 12345,
  estimatedOutputBytes: 654321,
  warnings: ['Large output']
}

describe('renderer view-model helpers', () => {
  it('formats bytes compactly', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('converts bytes to megabytes for settings hydration', () => {
    expect(bytesToMegabytes(10 * 1024 * 1024)).toBe(10)
  })

  it('derives project name from POSIX and Windows paths', () => {
    expect(projectNameFromPath('/Users/a/project')).toBe('project')
    expect(projectNameFromPath('C:\\\\Users\\\\a\\\\project')).toBe('project')
    expect(projectNameFromPath('')).toBe('project')
  })

  it('creates stable request keys regardless of pattern order', () => {
    const first = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['b', 'a'],
      excludePatterns: ['dist', '.git']
    })
    const second = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['a', 'b'],
      excludePatterns: ['.git', 'dist']
    })
    expect(first).toBe(second)
  })

  it('maps preview metrics for inspector and workspace panels', () => {
    expect(toPreviewMetrics(preview)).toEqual({
      includedFiles: 2,
      skippedFiles: 1,
      estimatedTokens: '12,345',
      estimatedOutput: '639.0 KB'
    })
  })
})
```

- [ ] **Step 3: Run the new tests and verify failure**

Run:

```bash
bunx vitest run packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts
```

Expected: fail because `view-model.ts` does not exist yet.

- [ ] **Step 4: Implement helper module**

Create `packages/desktop/src/renderer/src/features/ingest/model/view-model.ts`:

```ts
import type { PreviewResult } from '../../../env'

export function bytesToMegabytes(value: number): number {
  return Number((value / (1024 * 1024)).toFixed(1))
}

export function megabytesToBytes(value: string): number {
  return Math.max(1, Math.round(Number(value || '0') * 1024 * 1024))
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function projectNameFromPath(folderPath: string): string {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'project'
}

export function makeRequestKey(payload: {
  rootDir: string
  format: 'markdown' | 'text'
  maxFileSizeBytes: number
  includePatterns: string[]
  excludePatterns: string[]
}): string {
  return JSON.stringify({
    ...payload,
    includePatterns: [...payload.includePatterns].sort(),
    excludePatterns: [...payload.excludePatterns].sort()
  })
}

export function toPreviewMetrics(preview: PreviewResult | null): {
  includedFiles: number
  skippedFiles: number
  estimatedTokens: string
  estimatedOutput: string
} {
  if (!preview) {
    return {
      includedFiles: 0,
      skippedFiles: 0,
      estimatedTokens: '0',
      estimatedOutput: '0 B'
    }
  }

  return {
    includedFiles: preview.includedFiles.length,
    skippedFiles: preview.skippedFiles.length,
    estimatedTokens: preview.estimatedTokenCount.toLocaleString(),
    estimatedOutput: formatBytes(preview.estimatedOutputBytes)
  }
}
```

- [ ] **Step 5: Add test script for renderer model tests**

Modify `packages/desktop/package.json` test script to include the new test file:

```json
"test": "vitest run src/main/validators.test.ts src/main/file-actions.test.ts src/main/paths.test.ts src/renderer/src/drop.test.ts src/renderer/src/features/ingest/model/view-model.test.ts"
```

- [ ] **Step 6: Run focused and desktop tests**

Run:

```bash
bunx vitest run packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts
bun run --filter @git-ingest/desktop test
```

Expected: both pass.

- [ ] **Step 7: Commit**

Run:

```bash
git status --short
git add packages/desktop/package.json packages/desktop/src/renderer/src/features/ingest/model/types.ts packages/desktop/src/renderer/src/features/ingest/model/view-model.ts packages/desktop/src/renderer/src/features/ingest/model/view-model.test.ts
git commit -m "test(desktop): add renderer view model helpers"
```

Expected: one test/model commit.

---

### Task 3: Add Shared UI Primitives And Local Icons

**Files:**

- Create: `packages/desktop/src/renderer/src/shared/lib/cn.ts`
- Create: `packages/desktop/src/renderer/src/shared/icons/Icons.tsx`
- Create: `packages/desktop/src/renderer/src/shared/ui/Button.tsx`
- Create: `packages/desktop/src/renderer/src/shared/ui/MetricCard.tsx`
- Create: `packages/desktop/src/renderer/src/shared/ui/SegmentedControl.tsx`

- [ ] **Step 1: Create class-name helper**

Create `packages/desktop/src/renderer/src/shared/lib/cn.ts`:

```ts
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
```

- [ ] **Step 2: Create local icons**

Create `packages/desktop/src/renderer/src/shared/icons/Icons.tsx` with local SVG icons:

```tsx
import type { ReactElement, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconShell({ children, ...props }: IconProps): ReactElement {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  )
}

export function CheckIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="m5 12 4 4L19 6" /></IconShell>
}

export function ClockIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></IconShell>
}

export function CopyIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><rect height="11" rx="2" width="11" x="8" y="8" /><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></IconShell>
}

export function ExternalIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="M14 4h6v6" /><path d="m10 14 10-10" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></IconShell>
}

export function FileIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /></IconShell>
}

export function FolderIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></IconShell>
}

export function PlayIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="m8 5 11 7-11 7Z" /></IconShell>
}

export function SearchIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></IconShell>
}

export function SettingsIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.4 7A2 2 0 0 1 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 20 7.2l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z" /></IconShell>
}

export function ShieldIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></IconShell>
}

export function SidebarIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><rect height="16" rx="2" width="18" x="3" y="4" /><path d="M9 4v16" /></IconShell>
}

export function TableIcon(props: IconProps): ReactElement {
  return <IconShell {...props}><rect height="16" rx="2" width="18" x="3" y="4" /><path d="M3 10h18" /><path d="M9 10v10" /></IconShell>
}
```

- [ ] **Step 3: Create shared button**

Create `packages/desktop/src/renderer/src/shared/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

import { cn } from '../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'native-button-shine bg-accent text-white shadow-[0_10px_26px_rgba(10,132,255,0.22)] hover:bg-accent-strong active:translate-y-px',
  secondary: 'native-button-shine bg-white/80 text-ink ring-1 ring-line-strong hover:bg-black/[0.055] active:translate-y-px',
  ghost: 'bg-transparent text-muted hover:bg-black/[0.04] hover:text-ink active:translate-y-px',
  toolbar: 'native-button-shine bg-black/[0.04] text-ink/86 ring-1 ring-line hover:bg-black/[0.055] active:translate-y-px',
  danger: 'bg-danger-soft text-danger-strong ring-1 ring-danger/20 hover:bg-danger-soft active:translate-y-px'
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-10 px-4 text-[13px]'
}

export function Button({ className, variant = 'secondary', size = 'md', leftIcon, rightIcon, children, ...props }: ButtonProps): ReactElement {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-medium outline-none transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-accent/70',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      type="button"
      {...props}
    >
      {leftIcon}
      {children ? <span>{children}</span> : null}
      {rightIcon}
    </button>
  )
}
```

- [ ] **Step 4: Create metric card**

Create `packages/desktop/src/renderer/src/shared/ui/MetricCard.tsx`:

```tsx
import type { ReactElement } from 'react'

export type MetricCardProps = {
  label: string
  value: string
  helper?: string
}

export function MetricCard({ label, value, helper }: MetricCardProps): ReactElement {
  return (
    <div className="rounded-[12px] border border-line bg-white/76 p-3 shadow-panel">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/38">{label}</div>
      <div className="mt-2 truncate text-[18px] font-semibold tracking-[-0.02em] text-ink">{value}</div>
      {helper ? <div className="mt-1 truncate text-[11px] text-muted">{helper}</div> : null}
    </div>
  )
}
```

- [ ] **Step 5: Create segmented control**

Create `packages/desktop/src/renderer/src/shared/ui/SegmentedControl.tsx`:

```tsx
import type { ReactElement } from 'react'

import { cn } from '../lib/cn'

export type SegmentedControlProps<T extends string> = {
  items: ReadonlyArray<{ value: T; label: string }>
  selected: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ items, selected, onChange }: SegmentedControlProps<T>): ReactElement {
  return (
    <div className="inline-flex h-8 items-center rounded-[9px] border border-line bg-black/[0.035] p-0.5">
      {items.map((item) => (
        <button
          key={item.value}
          className={cn(
            'h-6 rounded-[7px] px-3 text-[12px] font-medium transition',
            item.value === selected ? 'bg-white text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]' : 'text-muted hover:text-ink'
          )}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck shared modules**

Run:

```bash
bun run --filter @git-ingest/desktop build
```

Expected: build may still use old `App.tsx`, but new modules should typecheck. Fix import/type errors before committing.

- [ ] **Step 7: Commit**

Run:

```bash
git status --short
git add packages/desktop/src/renderer/src/shared/lib/cn.ts packages/desktop/src/renderer/src/shared/icons/Icons.tsx packages/desktop/src/renderer/src/shared/ui/Button.tsx packages/desktop/src/renderer/src/shared/ui/MetricCard.tsx packages/desktop/src/renderer/src/shared/ui/SegmentedControl.tsx
git commit -m "feat(desktop): add native renderer primitives"
```

Expected: one shared UI commit.

---

### Task 4: Add Feature UI Components

**Files:**

- Create: `packages/desktop/src/renderer/src/features/ingest/ui/AppChrome.tsx`
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Sidebar.tsx`
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/StatusBar.tsx`
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Inspector.tsx`
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/RulesSheet.tsx`
- Create: `packages/desktop/src/renderer/src/features/ingest/ui/Workspace.tsx`

- [ ] **Step 1: Create `AppChrome.tsx`**

Create toolbar component with the primary generate action:

```tsx
import type { ReactElement } from 'react'

import { Button } from '../../../shared/ui/Button'
import { PlayIcon, SearchIcon, ShieldIcon, SidebarIcon } from '../../../shared/icons/Icons'

export type AppChromeProps = {
  isGenerating: boolean
  canGenerate: boolean
  onGenerate: () => void
}

export function AppChrome({ isGenerating, canGenerate, onGenerate }: AppChromeProps): ReactElement {
  return (
    <header className="native-toolbar grid h-[52px] grid-cols-[260px_1fr_340px] border-b border-line" data-electron-drag-region>
      <div className="flex items-center gap-3 px-4" data-electron-drag-region>
        <div className="flex items-center gap-2" data-electron-drag-region>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <button className="ml-2 flex h-7 w-7 items-center justify-center rounded-[8px] text-ink/58 transition hover:bg-black/[0.04] hover:text-ink" type="button">
          <SidebarIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-center gap-3 px-4" data-electron-drag-region>
        <div className="min-w-0 text-center leading-none" data-electron-drag-region>
          <div className="truncate text-[13px] font-semibold text-ink/92">Git-Ingest</div>
          <div className="mt-1 truncate text-[11px] text-muted">Project -> Filter -> Generate -> Export</div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-3" data-electron-drag-region>
        <div className="hidden h-8 items-center gap-2 rounded-[9px] border border-line bg-black/[0.035] px-2.5 text-xs text-muted xl:flex">
          <SearchIcon className="h-3.5 w-3.5" />
          <span>Command</span>
          <kbd className="rounded bg-black/[0.055] px-1.5 py-0.5 text-[10px] text-ink/72">⌘K</kbd>
        </div>
        <div className="hidden h-8 items-center gap-1.5 rounded-[9px] border border-success/20 bg-success-soft px-2.5 text-xs font-medium text-success-strong lg:flex">
          <ShieldIcon className="h-3.5 w-3.5" />
          Local
        </div>
        <Button disabled={!canGenerate || isGenerating} leftIcon={<PlayIcon className="h-3.5 w-3.5" />} onClick={onGenerate} size="sm" variant="primary">
          {isGenerating ? 'Running' : 'Generate'}
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `Sidebar.tsx`**

Create navigation and recent project list:

```tsx
import type { ReactElement } from 'react'

import type { AppState } from '../../../env'
import type { AppView } from '../model/types'
import { ClockIcon, FolderIcon, SettingsIcon } from '../../../shared/icons/Icons'
import { cn } from '../../../shared/lib/cn'

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

export function Sidebar({ selectedView, recentProjects, onViewChange, onSelectRecentProject }: SidebarProps): ReactElement {
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
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/36">Library</div>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const selected = selectedView === item.view
            return (
              <button key={item.view} className={cn('flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] transition', selected ? 'bg-accent text-white shadow-[0_8px_22px_rgba(10,132,255,0.18)]' : 'text-ink/68 hover:bg-black/[0.04] hover:text-ink')} onClick={() => onViewChange(item.view)} type="button">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="min-h-0 flex-1 px-3 pt-4">
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/36">Recent Projects</div>
        <div className="min-h-0 space-y-0.5 overflow-auto">
          {recentProjects.length === 0 ? <p className="px-2 text-[12px] leading-5 text-muted">Recent folders appear after preview or generation.</p> : null}
          {recentProjects.map((project) => (
            <button key={project.path} className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition hover:bg-black/[0.035]" onClick={() => onSelectRecentProject(project.path)} type="button">
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
```

- [ ] **Step 3: Create `StatusBar.tsx`**

Create status footer:

```tsx
import type { ReactElement } from 'react'

import type { GenerateResult, PreviewResult } from '../../../env'
import { formatBytes } from '../model/view-model'

export type StatusBarProps = {
  folderPath: string
  preview: PreviewResult | null
  generated: GenerateResult | null
  phase: string
}

export function StatusBar({ folderPath, preview, generated, phase }: StatusBarProps): ReactElement {
  const outputState = generated ? `${formatBytes(generated.outputBytes)} output` : 'No output'
  const previewState = preview ? `${preview.includedFiles.length} files · ${preview.estimatedTokenCount.toLocaleString()} tokens` : 'No preview'

  return (
    <footer className="native-toolbar grid h-[26px] grid-cols-[260px_1fr_340px] border-t border-line text-[11px] text-muted">
      <div className="flex items-center border-r border-line px-3">
        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-success" />
        Local workspace
      </div>
      <div className="flex min-w-0 items-center justify-between px-3">
        <span className="truncate">{folderPath || 'No folder selected'}</span>
        <span className="ml-4 shrink-0">{previewState}</span>
      </div>
      <div className="flex items-center justify-between border-l border-line px-3">
        <span>Status: {phase || 'ready'}</span>
        <span>{outputState}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Create inspector, rules, and workspace components**

Create `Inspector.tsx`, `RulesSheet.tsx`, and `Workspace.tsx` with the prop surfaces below. Bind every displayed value to props from `App.tsx`. Do not include `Templates`, mock projects, mock runs, or hard-coded output.

Required prop surfaces:

```ts
import type { DragEventHandler } from 'react'

// Inspector.tsx
export type InspectorProps = {
  preview: PreviewResult | null
  generated: GenerateResult | null
  savedFilePath: string | null
  error: DesktopError | null
  message: string
  onCopy: () => void
  onSave: () => void
  onOpenSavedFile: () => void
  onRevealSavedFile: () => void
  onClearOutput: () => void
}

// RulesSheet.tsx
export type RulesSheetProps = {
  rules: RulesDraft
  onRulesChange: (rules: RulesDraft) => void
  onAddPattern: (kind: 'include' | 'exclude') => void
  onRemovePattern: (kind: 'include' | 'exclude', pattern: string) => void
  onClose: () => void
}

// Workspace.tsx
export type WorkspaceProps = {
  selectedView: AppView
  folderPath: string
  preview: PreviewResult | null
  generated: GenerateResult | null
  runs: RunRecord[]
  rules: RulesDraft
  busy: boolean
  readyToGenerate: boolean
  phase: string
  progressCounts: { processed?: number; total?: number }
  isDragging: boolean
  rulesOpen: boolean
  onChooseFolder: () => void
  onGenerate: () => void
  onCancel: () => void
  onOpenRules: () => void
  onCloseRules: () => void
  onRulesChange: (rules: RulesDraft) => void
  onAddPattern: (kind: 'include' | 'exclude') => void
  onRemovePattern: (kind: 'include' | 'exclude', pattern: string) => void
  onDragEnter: DragEventHandler<HTMLDivElement>
  onDragLeave: DragEventHandler<HTMLDivElement>
  onDragOver: DragEventHandler<HTMLDivElement>
  onDrop: DragEventHandler<HTMLDivElement>
}
```

Expected UI requirements:

- Empty project state includes `Choose Folder` and drag/drop affordance.
- Project state includes header, preview table, pipeline panel, and output editor.
- Runs view shows only `runs` from the current session.
- Settings view edits the same `rules` object as the rules sheet.
- Error and warning text must be visible without overlapping controls.

- [ ] **Step 5: Build to catch component type errors**

Run:

```bash
bun run --filter @git-ingest/desktop build
```

Expected: build may fail because `App.tsx` is not wired to these components yet only if exported types are wrong. Fix component-local type errors before committing.

- [ ] **Step 6: Commit**

Run:

```bash
git status --short
git add packages/desktop/src/renderer/src/features/ingest/ui/AppChrome.tsx packages/desktop/src/renderer/src/features/ingest/ui/Sidebar.tsx packages/desktop/src/renderer/src/features/ingest/ui/StatusBar.tsx packages/desktop/src/renderer/src/features/ingest/ui/Inspector.tsx packages/desktop/src/renderer/src/features/ingest/ui/RulesSheet.tsx packages/desktop/src/renderer/src/features/ingest/ui/Workspace.tsx
git commit -m "feat(desktop): add native ingest UI components"
```

Expected: one feature UI commit.

---

### Task 5: Replace App Coordinator And Preserve Real IPC Flow

**Files:**

- Modify: `packages/desktop/src/renderer/src/App.tsx`

- [ ] **Step 1: Replace local helper definitions with imports**

In `App.tsx`, remove local `bytesToMegabytes`, `formatBytes`, `projectNameFromPath`, and `makeRequestKey`. Import:

```ts
import type { AppView, RulesDraft, RunRecord } from './features/ingest/model/types'
import { bytesToMegabytes, makeRequestKey, megabytesToBytes } from './features/ingest/model/view-model'
import { AppChrome } from './features/ingest/ui/AppChrome'
import { Sidebar } from './features/ingest/ui/Sidebar'
import { Workspace } from './features/ingest/ui/Workspace'
import { Inspector } from './features/ingest/ui/Inspector'
import { StatusBar } from './features/ingest/ui/StatusBar'
```

- [ ] **Step 2: Add view, rules, and runs state**

In `App`, replace individual format/pattern input state with `RulesDraft`:

```ts
const [selectedView, setSelectedView] = useState<AppView>('projects')
const [rulesOpen, setRulesOpen] = useState(false)
const [runs, setRuns] = useState<RunRecord[]>([])
const [rules, setRules] = useState<RulesDraft>({
  format: 'markdown',
  maxFileSizeMb: '10',
  includeInput: '',
  excludeInput: '',
  includePatterns: [],
  excludePatterns: []
})
```

- [ ] **Step 3: Hydrate rules from saved state**

In the existing `getState()` effect, set rules from state:

```ts
setRules({
  format: state.settings.format,
  maxFileSizeMb: String(bytesToMegabytes(state.settings.maxFileSizeBytes)),
  includeInput: '',
  excludeInput: '',
  includePatterns: state.settings.includePatterns,
  excludePatterns: state.settings.excludePatterns
})
setRulesOpen(false)
```

- [ ] **Step 4: Update request payload derivation**

Replace `requestPayload` with:

```ts
const requestPayload = useMemo(() => ({
  rootDir: folderPath,
  format: rules.format,
  maxFileSizeBytes: megabytesToBytes(rules.maxFileSizeMb),
  includePatterns: rules.includePatterns,
  excludePatterns: rules.excludePatterns
}), [folderPath, rules.excludePatterns, rules.format, rules.includePatterns, rules.maxFileSizeMb])
```

- [ ] **Step 5: Update pattern handlers**

Replace `addPattern` with rules-based handlers:

```ts
function addPattern(kind: 'include' | 'exclude') {
  const inputKey = kind === 'include' ? 'includeInput' : 'excludeInput'
  const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns'
  const value = rules[inputKey].trim()
  if (!value) return

  setRules((current) => ({
    ...current,
    [inputKey]: '',
    [listKey]: [...current[listKey], value]
  }))
}

function removePattern(kind: 'include' | 'exclude', pattern: string) {
  const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns'
  setRules((current) => ({
    ...current,
    [listKey]: current[listKey].filter((entry) => entry !== pattern)
  }))
}
```

- [ ] **Step 6: Record session runs on generation completion**

Inside the `onGenerationFinished` success branch, after setting generated data:

```ts
setRuns((current) => [
  {
    id: message.requestId,
    projectName: message.result.projectName,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokenCount: message.result.tokenEstimate,
    outputBytes: message.result.outputBytes,
    status: 'success'
  },
  ...current
])
```

For cancelled and error completion, add a run only if a folder is selected and a preview exists:

```ts
setRuns((current) => folderPath && preview ? [
  {
    id: message.requestId,
    projectName: preview.projectName,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokenCount: preview.estimatedTokenCount,
    outputBytes: preview.estimatedOutputBytes,
    status: message.status
  },
  ...current
] : current)
```

If closure freshness is an issue, use refs for `folderPath` and `preview`.

- [ ] **Step 7: Render new shell**

Replace the returned JSX with:

```tsx
return (
  <div className="h-dvh overflow-hidden p-0 text-ink selection:bg-accent/30 lg:p-5">
    <div className="relative mx-auto grid h-full max-w-[1680px] grid-rows-[52px_1fr_26px] overflow-hidden border-line-strong bg-window shadow-window ring-1 ring-line lg:rounded-[18px] lg:border">
      <AppChrome canGenerate={readyToGenerate} isGenerating={busy} onGenerate={generateOutput} />
      <div className="grid min-h-0 grid-cols-[260px_minmax(0,1fr)_340px]">
        <Sidebar
          onSelectRecentProject={(path) => {
            setFolderPath(path)
            setPreview(null)
            setGenerated(null)
            setSavedFilePath(null)
            setLastPreviewKey(null)
            setSelectedView('projects')
          }}
          onViewChange={setSelectedView}
          recentProjects={recentProjects}
          selectedView={selectedView}
        />
        <Workspace
          busy={busy}
          folderPath={folderPath}
          generated={generated}
          isDragging={isDragging}
          onAddPattern={addPattern}
          onCancel={cancelGeneration}
          onChooseFolder={() => void chooseFolder()}
          onCloseRules={() => setRulesOpen(false)}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            if (event.currentTarget === event.target) setIsDragging(false)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onGenerate={generateOutput}
          onOpenRules={() => setRulesOpen(true)}
          onRemovePattern={removePattern}
          onRulesChange={setRules}
          phase={phase}
          preview={preview}
          progressCounts={progressCounts}
          readyToGenerate={readyToGenerate}
          rules={rules}
          rulesOpen={rulesOpen}
          runs={runs}
          selectedView={selectedView}
        />
        <Inspector
          error={error}
          generated={generated}
          message={message}
          onClearOutput={() => {
            setGenerated(null)
            setSavedFilePath(null)
            setMessage('')
          }}
          onCopy={() => void copyOutput()}
          onOpenSavedFile={() => void openSavedFile()}
          onRevealSavedFile={() => void revealSavedFile()}
          onSave={() => void saveOutput()}
          preview={preview}
          savedFilePath={savedFilePath}
        />
      </div>
      <StatusBar folderPath={folderPath} generated={generated} phase={phase} preview={preview} />
    </div>
  </div>
)
```

- [ ] **Step 8: Run desktop tests and build**

Run:

```bash
bun run --filter @git-ingest/desktop test
bun run build:desktop
```

Expected: both pass.

- [ ] **Step 9: Commit**

Run:

```bash
git status --short
git add packages/desktop/src/renderer/src/App.tsx
git commit -m "feat(desktop): wire native renderer shell"
```

Expected: one integration commit.

---

### Task 6: Replace CSS With Native Light System

**Files:**

- Modify: `packages/desktop/src/renderer/src/styles.css`

- [ ] **Step 1: Replace stylesheet**

Replace the file with:

```css
@import "tailwindcss";

@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  --color-app: #edf2f9;
  --color-window: #fbfcff;
  --color-toolbar: rgba(246, 248, 252, 0.86);
  --color-sidebar: rgba(236, 242, 249, 0.84);
  --color-line: #d8dee9;
  --color-line-strong: #c7d0de;
  --color-ink: #182033;
  --color-muted: #687083;
  --color-accent: #0a84ff;
  --color-accent-strong: #0066cc;
  --color-accent-soft: #dcebff;
  --color-success: #34c759;
  --color-success-strong: #1f7a3a;
  --color-success-soft: #e9f8ee;
  --color-warning: #ff9f0a;
  --color-warning-soft: #fff3dd;
  --color-danger: #ff3b30;
  --color-danger-strong: #b42318;
  --color-danger-soft: #fff0ef;
  --shadow-panel: 0 12px 34px rgba(31, 42, 68, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.88);
  --shadow-window: 0 34px 90px rgba(28, 39, 62, 0.22), 0 3px 16px rgba(28, 39, 62, 0.12);
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 14% 12%, rgba(10, 132, 255, 0.15), transparent 30%),
    radial-gradient(circle at 86% 8%, rgba(120, 91, 255, 0.10), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #edf2f9 52%, #e7edf6 100%);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: default;
}

pre,
code,
.mono {
  font-family: "SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

[data-electron-drag-region] {
  -webkit-app-region: drag;
}

button,
a,
input,
textarea,
select {
  -webkit-app-region: no-drag;
}

.native-material {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 254, 0.78)),
    rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(30px) saturate(148%);
}

.native-toolbar {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(238, 244, 252, 0.84)),
    var(--color-toolbar);
  backdrop-filter: blur(34px) saturate(155%);
}

.native-sidebar {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(235, 241, 249, 0.84)),
    var(--color-sidebar);
  backdrop-filter: blur(34px) saturate(150%);
}

.native-button-shine {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 1px 2px rgba(31, 42, 68, 0.12);
}

.output-editor {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 254, 0.94)),
    #ffffff;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(55, 65, 81, 0.20);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 1100px) {
  .grid-cols-\[260px_minmax\(0\,1fr\)_340px\] {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .grid-cols-\[260px_1fr_340px\] {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  aside.native-material {
    display: none;
  }
}
```

- [ ] **Step 2: Build CSS**

Run:

```bash
bun run build:desktop
```

Expected: Tailwind processes `@import "tailwindcss"` and all custom theme tokens without CSS errors.

- [ ] **Step 3: Commit**

Run:

```bash
git status --short
git add packages/desktop/src/renderer/src/styles.css
git commit -m "style(desktop): apply native light renderer theme"
```

Expected: one style commit.

---

### Task 7: Full Verification And Manual Smoke

**Files:**

- Modify only if verification finds bugs in files touched by earlier tasks.

- [ ] **Step 1: Run full workspace tests**

Run:

```bash
bun test
```

Expected: all workspace tests pass.

- [ ] **Step 2: Run desktop build**

Run:

```bash
bun run build:desktop
```

Expected: Electron desktop build passes.

- [ ] **Step 3: Run smoke test**

Run:

```bash
bun run test:smoke
```

Expected: smoke launch test passes. If blocked by local display, signing, or Electron runtime constraints, record exact output in the final response and do not claim it passed.

- [ ] **Step 4: Start desktop dev app**

Run:

```bash
bun run dev:desktop
```

Expected: Electron app opens with the native light UI. Keep this process running only while manually checking, then stop it with `Ctrl+C`.

- [ ] **Step 5: Manually inspect required states**

Verify:

- Empty/no folder state.
- Folder selected with preview.
- Rules sheet edits format, max size, include patterns, and exclude patterns.
- Rules edits refresh preview and clear stale output.
- Generating state shows progress and can cancel.
- Generated output can copy, save, open saved file, and reveal saved file.
- Runs view shows current-session generation history.
- Settings view edits the same rules state.
- Inspector shows metrics, warnings, safety, actions, and errors.
- Text does not overlap at desktop width and at a narrow responsive width.

- [ ] **Step 6: Commit verification fixes**

If fixes were needed, commit them:

```bash
git status --short
git add packages/desktop/src/renderer/src/App.tsx packages/desktop/src/renderer/src/styles.css packages/desktop/src/renderer/src/features/ingest/ui/Workspace.tsx packages/desktop/src/renderer/src/features/ingest/ui/Inspector.tsx packages/desktop/src/renderer/src/features/ingest/ui/RulesSheet.tsx
git commit -m "fix(desktop): polish native renderer verification issues"
```

Expected: no commit if no fixes were needed.

- [ ] **Step 7: Final status**

Run:

```bash
git status --short
git log --oneline -7
```

Expected: worktree clean except any intentional untracked local files. Recent commits should show the plan's task commits.
