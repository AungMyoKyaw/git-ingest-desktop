# Git-Ingest Desktop MVP Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing Electron desktop app with the approved MVP design by making preview automatic, surfacing confidence metrics clearly, and making generated-output actions reflect the latest result.

**Architecture:** Keep the current secure Electron main/preload/renderer split and existing `@git-ingest/core` scan/generate pipeline. Extend the existing data contracts just enough for the renderer to express the MVP, then rework the single renderer app shell and CSS around explicit empty/previewing/ready/generating/generated states.

**Tech Stack:** Bun workspace, TypeScript, Vitest, Electron, electron-vite, React

## Global Constraints

- No cloud upload or AI API integration.
- No broad component-library migration to Tailwind, shadcn/ui, or Radix in this pass.
- No full renderer file-structure rewrite solely to mirror the aspirational design doc.
- No V2-only features added just because they are mentioned in the design document.
- Keep already-built extras such as drag-and-drop and cancel generation only if they do not complicate the MVP.

---

### Task 1: Extend desktop preview and generated-output contracts

**Covers:** [S1, S2, S4, S5, S6, S9, S10]

**Files:**

- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/scan-project.ts`
- Modify: `packages/desktop/src/main/generation.ts`
- Modify: `packages/desktop/src/main/ipc.ts`
- Modify: `packages/desktop/src/main/state.ts`
- Modify: `packages/desktop/src/preload/index.ts`
- Modify: `packages/desktop/src/renderer/src/env.d.ts`
- Create: `packages/desktop/src/main/generation.test.ts`

**Interfaces:**

- Consumes: `previewProject(options: ScanProjectOptions): Promise<ProjectSummary>`, `generateProjectOutput(options: ScanProjectOptions): Promise<GenerateProjectResult>`
- Produces: preview payloads that include `estimatedTokenCount`; generation-finished payloads that include `savedOutputPath: string | null`; persisted app state that can remember the latest generated file path per project

- [ ] **Step 1: Write the failing desktop contract tests**

```ts
import { describe, expect, it, vi } from 'vitest';

import { createGenerationManager } from './generation.js';

describe('createGenerationManager', () => {
  it('includes the saved output path on success messages', async () => {
    const finished = vi.fn();
    const manager = createGenerationManager({
      outputDirectory: '/tmp/git-ingest-tests',
      onProgress: vi.fn(),
      onFinished: finished,
    });

    await manager.start({ rootDir: '/tmp/project', format: 'markdown' });

    expect(finished).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        savedOutputPath: expect.stringMatching(/git-ingest-output\.md$/),
      }),
    );
  });
});
```

- [ ] **Step 2: Run the desktop contract test to verify failure**

Run: `bun test packages/desktop/src/main/generation.test.ts`
Expected: FAIL because `createGenerationManager` does not yet write a generated file or report `savedOutputPath`

- [ ] **Step 3: Extend the core and desktop contracts with the minimum new fields**

```ts
export interface ProjectSummary {
  projectName: string;
  rootDir: string;
  totalFiles: number;
  includedFiles: IncludedFile[];
  skippedFiles: SkippedFile[];
  ignoredDirectories: IgnoredDirectory[];
  fileTypes: FileTypeSummary[];
  estimatedTokenCount: number;
  estimatedOutputBytes: number;
  warnings: string[];
}

export type GenerationFinishedMessage =
  | {
      requestId: string;
      status: 'success';
      result: GenerateProjectResult;
      savedOutputPath: string | null;
    }
  | {
      requestId: string;
      status: 'cancelled';
      error: { code: string; userMessage: string; detail: string | null };
    }
  | {
      requestId: string;
      status: 'error';
      error: { code: string; userMessage: string; detail: string | null };
    };
```

```ts
async function writeGeneratedOutput(outputDirectory: string, result: GenerateProjectResult) {
  const extension = result.format === 'text' ? 'txt' : 'md';
  const filePath = path.join(
    outputDirectory,
    `${result.projectName}-git-ingest-output.${extension}`,
  );
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(filePath, result.output, 'utf8');
  return filePath;
}
```

- [ ] **Step 4: Persist the generated file path and surface it through IPC/preload types**

```ts
export interface RecentProject {
  path: string;
  name: string;
  lastOpenedAt: string;
  lastGeneratedFilePath?: string | null;
}

export interface GenerateResult extends PreviewResult {
  format: 'markdown' | 'text';
  output: string;
  outputBytes: number;
  tokenEstimate: number;
  savedOutputPath: string | null;
}
```

```ts
onFinished: async (message) => {
  if (message.status === 'success') {
    await updateAppState(userDataPath, (state) =>
      rememberRecentProject(state, message.result.rootDir, message.savedOutputPath),
    );
  }

  window.webContents.send('desktop:generation-finished', message);
};
```

- [ ] **Step 5: Re-run the focused desktop contract test**

Run: `bun test packages/desktop/src/main/generation.test.ts`
Expected: PASS with a success message that includes `savedOutputPath`

### Task 2: Rework the renderer around auto-preview and confidence-first states

**Covers:** [S2, S4, S5, S7, S8, S9, S10]

**Files:**

- Modify: `packages/desktop/src/renderer/src/App.tsx`
- Modify: `packages/desktop/src/renderer/src/styles.css`
- Modify: `packages/desktop/src/renderer/src/env.d.ts`
- Create: `packages/desktop/src/renderer/src/app-view-model.test.ts`

**Interfaces:**

- Consumes: `window.gitIngest.getState()`, `window.gitIngest.chooseFolder()`, `window.gitIngest.preview()`, `window.gitIngest.generate()`, `window.gitIngest.onGenerationFinished()`
- Produces: renderer behavior where folder selection, drag-and-drop, and recent-project selection all trigger preview automatically; generated-state actions use the latest `savedOutputPath`

- [ ] **Step 1: Write the failing renderer view-model test**

```ts
import { describe, expect, it } from 'vitest';

import { deriveAppViewState } from './App.js';

describe('deriveAppViewState', () => {
  it('treats a selected folder with no preview as previewing', () => {
    expect(
      deriveAppViewState({
        folderPath: '/tmp/project',
        preview: null,
        generated: null,
        busy: true,
        error: null,
      }),
    ).toBe('previewing');
  });

  it('treats a previewed folder with no generated output as ready', () => {
    expect(
      deriveAppViewState({
        folderPath: '/tmp/project',
        preview: { totalFiles: 4 },
        generated: null,
        busy: false,
        error: null,
      }),
    ).toBe('ready');
  });
});
```

- [ ] **Step 2: Run the renderer test to verify failure**

Run: `bun test packages/desktop/src/renderer/src/app-view-model.test.ts`
Expected: FAIL because `deriveAppViewState` does not exist yet

- [ ] **Step 3: Add the minimum renderer state helpers and auto-preview flow**

```ts
export type AppViewState = 'empty' | 'previewing' | 'ready' | 'generating' | 'generated' | 'error';

export function deriveAppViewState(input: {
  folderPath: string;
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  busy: boolean;
  error: DesktopError | null;
}): AppViewState {
  if (input.error) return 'error';
  if (!input.folderPath) return 'empty';
  if (input.busy && !input.generated) return input.preview ? 'generating' : 'previewing';
  if (input.generated) return 'generated';
  if (input.preview) return 'ready';
  return 'previewing';
}
```

```ts
async function loadPreview(nextFolderPath: string) {
  resetFeedback();
  setBusy(true);
  setPhase('Scanning project');
  setFolderPath(nextFolderPath);
  setPreview(null);
  setGenerated(null);

  const result = await window.gitIngest.preview({ ...requestPayload, rootDir: nextFolderPath });

  setBusy(false);
  setPhase('');
  if (!result.ok) {
    setError(result.error);
    return;
  }

  setPreview(result.result);
}
```

- [ ] **Step 4: Reshape the rendered layout and copy to the approved MVP**

```tsx
<header className="app-header">
  <div>
    <h1>Git-Ingest</h1>
    <p>Choose a project. Know exactly what AI will see.</p>
  </div>
  <span className="trust-badge">Local Only</span>
</header>

<section className="selected-project-card">
  <div className="project-meta">
    <div className="eyebrow">Selected Project</div>
    <div className="project-name">{projectNameFromPath(folderPath)}</div>
    <div className="project-path">{folderPath}</div>
  </div>
  <div className="project-actions">Change Folder / Advanced / Generate</div>
</section>
<section className="preview-card">
  <div className="metric-list">Included / Ignored / Tokens / Size</div>
</section>
<section className="output-card">
  <div className="output-actions">Copy / Save As / Open File / Reveal in Finder</div>
</section>
<section className="recent-projects-card">
  <ul className="recent-project-list">recent projects here</ul>
</section>
```

```css
.app-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
}

.trust-badge {
  border: 1px solid rgba(124, 199, 153, 0.35);
  background: rgba(46, 125, 87, 0.18);
}

.metric-list {
  display: grid;
  gap: 12px;
}
```

- [ ] **Step 5: Make recent-project selection and generated-output actions use the new data**

```ts
async function handleRecentProject(path: string) {
  await loadPreview(path);
}

const selectedRecentProject = recentProjects.find((entry) => entry.path === folderPath);
const resolvedSavedPath =
  generated?.savedOutputPath ?? selectedRecentProject?.lastGeneratedFilePath ?? null;
```

- [ ] **Step 6: Re-run the focused renderer test**

Run: `bun test packages/desktop/src/renderer/src/app-view-model.test.ts`
Expected: PASS with the new view-state helper exported from `App.tsx`

### Task 3: Update regression tests and verify the full workspace

**Covers:** [S3, S5, S6, S8, S9, S11]

**Files:**

- Modify: `packages/desktop/package.json`
- Modify: `packages/desktop/src/main/generation.test.ts`
- Modify: `packages/desktop/src/renderer/src/drop.test.ts`
- Modify: `packages/core/src/scan-project.test.ts`

**Interfaces:**

- Consumes: the updated preview contract, generation success payload, and renderer helper exports from Tasks 1 and 2
- Produces: a passing desktop test command, a passing workspace test command, and a successful workspace build

- [ ] **Step 1: Add failing assertions for preview token estimates and automatic-path output metadata**

```ts
it('returns an estimated token count during preview', async () => {
  const result = await previewProject({ rootDir: fixtureDir });
  expect(result.estimatedTokenCount).toBeGreaterThan(0);
});

it('keeps folder drops eligible for automatic preview', () => {
  expect(resolveDropSelection(validFolderDrop).kind).toBe('folder');
});
```

- [ ] **Step 2: Run the relevant targeted test files**

Run: `bun test packages/core/src/scan-project.test.ts packages/desktop/src/main/generation.test.ts packages/desktop/src/renderer/src/app-view-model.test.ts packages/desktop/src/renderer/src/drop.test.ts`
Expected: PASS after Tasks 1 and 2 are complete

- [ ] **Step 3: Run the desktop package test script**

Run: `bun run --filter @git-ingest/desktop test`
Expected: PASS with the new generation and renderer helper tests included

- [ ] **Step 4: Run the full workspace test suite**

Run: `bun test`
Expected: PASS for `@git-ingest/core`, `@git-ingest/cli`, and `@git-ingest/desktop`

- [ ] **Step 5: Run the workspace build**

Run: `bun run build`
Expected: PASS with the desktop renderer and main process compiling cleanly
