# Git-Ingest Desktop MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Git-Ingest monorepo with a shared scan/generate core, a preserved CLI entrypoint, and a secure Electron desktop app that can choose a folder, preview output, copy it, and save it.

**Architecture:** The repo will be a TypeScript Bun workspace with `packages/core`, `packages/cli`, and `packages/desktop`. Core owns scan and generation logic plus progress and structured errors; CLI and desktop are thin wrappers. Desktop uses Electron main/preload/renderer separation with explicit IPC and validated payloads.

**Tech Stack:** Bun, Node.js 22, Bun workspaces, TypeScript, Vitest, Electron, electron-vite, React

---

### Task 1: Bootstrap the workspace

**Files:**

- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `docs/compose/plans/2026-06-23-git-ingest-desktop-mvp.md`

- [ ] **Step 1: Add workspace package manifest**

Create a root `package.json` with Bun workspaces, shared scripts, and dev dependencies for TypeScript, Vitest, Electron, electron-vite, React, and packaging support.

- [ ] **Step 2: Add shared TypeScript config**

Create `tsconfig.base.json` with strict TypeScript defaults shared by all packages.

- [ ] **Step 3: Add ignore and project README**

Add `.gitignore` for `node_modules`, build outputs, coverage, and Electron artifacts. Add a README that preserves CLI usage and documents desktop development commands.

- [ ] **Step 4: Install dependencies**

Run: `bun install`
Expected: workspace dependencies installed without errors

### Task 2: Build shared core with tests

**Files:**

- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/errors.ts`
- Create: `packages/core/src/ignore.ts`
- Create: `packages/core/src/scan-project.ts`
- Create: `packages/core/src/generate-markdown.ts`
- Create: `packages/core/src/generate-text.ts`
- Create: `packages/core/src/token-estimate.ts`
- Test: `packages/core/src/scan-project.test.ts`

- [ ] **Step 1: Write failing core tests**

Add Vitest coverage for directory validation, include/exclude filtering, max file size, markdown generation, and progress callbacks.

- [ ] **Step 2: Run the core tests and verify failure**

Run: `bun test packages/core/src/scan-project.test.ts`
Expected: tests fail because core files do not exist yet

- [ ] **Step 3: Implement minimal core API**

Add a reusable options-driven scan service that returns structured preview/generation results and emits progress events. Implement markdown/text generators and structured app errors.

- [ ] **Step 4: Run the core tests and verify success**

Run: `bun test packages/core/src/scan-project.test.ts`
Expected: all core tests pass

### Task 3: Restore the CLI on top of core

**Files:**

- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/cli.ts`
- Create: `packages/cli/src/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests for argument parsing, markdown/text output, and `--copy` behavior wiring.

- [ ] **Step 2: Run the CLI tests and verify failure**

Run: `bun test packages/cli/src/cli.test.ts`
Expected: tests fail because CLI wrapper is missing

- [ ] **Step 3: Implement the CLI wrapper**

Parse flags, call the core service, optionally copy output through clipboardy, and keep the `git-ingest` bin entry stable.

- [ ] **Step 4: Run the CLI tests and verify success**

Run: `bun test packages/cli/src/cli.test.ts`
Expected: all CLI tests pass

### Task 4: Build secure desktop main/preload IPC

**Files:**

- Create: `packages/desktop/package.json`
- Create: `packages/desktop/tsconfig.json`
- Create: `packages/desktop/electron.vite.config.ts`
- Create: `packages/desktop/src/main/index.ts`
- Create: `packages/desktop/src/main/ipc.ts`
- Create: `packages/desktop/src/main/state.ts`
- Create: `packages/desktop/src/main/validators.ts`
- Create: `packages/desktop/src/preload/index.ts`
- Test: `packages/desktop/src/main/validators.test.ts`

- [ ] **Step 1: Write failing desktop security tests**

Add tests for IPC payload validation and safe URL validation.

- [ ] **Step 2: Run the desktop tests and verify failure**

Run: `bun test packages/desktop/src/main/validators.test.ts`
Expected: tests fail because desktop main files do not exist yet

- [ ] **Step 3: Implement secure Electron shell**

Create a single BrowserWindow with `contextIsolation`, `sandbox`, `nodeIntegration: false`, preload-only APIs, explicit IPC channels, controlled dialogs, and safe external link handling.

- [ ] **Step 4: Run the desktop tests and verify success**

Run: `bun test packages/desktop/src/main/validators.test.ts`
Expected: validation tests pass

### Task 5: Build the renderer MVP and verify end-to-end

**Files:**

- Create: `packages/desktop/src/renderer/index.html`
- Create: `packages/desktop/src/renderer/src/main.tsx`
- Create: `packages/desktop/src/renderer/src/App.tsx`
- Create: `packages/desktop/src/renderer/src/styles.css`

- [ ] **Step 1: Implement the desktop UI**

Build a single-window UI with empty state, folder picker, advanced options, preview/generate actions, output preview, copy/save actions, and recent folders.

- [ ] **Step 2: Build all packages**

Run: `bun run build`
Expected: core, cli, and desktop compile successfully

- [ ] **Step 3: Run the full test suite**

Run: `bun test`
Expected: all workspace tests pass

- [ ] **Step 4: Smoke-check desktop packaging path**

Run: `bun run package:desktop`
Expected: Electron app package output is produced without source junk
