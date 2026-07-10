# Remove CLI Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the standalone CLI workspace package and leave Git-Ingest as a working desktop-only Bun/Electron application.

**Architecture:** Keep `packages/core` as the shared scanning and generation library and keep `packages/desktop` as the only application package. Remove the CLI package and its workspace references without changing Electron IPC, renderer behavior, or core implementation.

**Tech Stack:** Bun workspaces, TypeScript, Vitest, Electron, electron-vite, electron-builder, GitHub Actions.

---

## File map

- Delete: `packages/cli/package.json`, `packages/cli/tsconfig.json`, `packages/cli/vitest.config.ts`, `packages/cli/src/cli.ts`, and `packages/cli/src/cli.test.ts` — the standalone CLI package.
- Modify: `package.json` — remove CLI build/test filters and the `build:cli` command.
- Modify: `README.md` — describe the remaining core and desktop packages and desktop-only commands.
- Modify: `.github/workflows/ci.yml` only if the workspace command changes require a CI-specific adjustment; prefer the root commands staying unchanged.
- Modify: current operational documentation that presents the CLI as current architecture; preserve the historical planning documents under `docs/compose/` and `docs/superpowers/`.
- Regenerate: `bun.lock` — remove the CLI workspace and CLI-only dependency entries.

### Task 1: Remove CLI package files

**Files:**

- Delete: `packages/cli/package.json`
- Delete: `packages/cli/tsconfig.json`
- Delete: `packages/cli/vitest.config.ts`
- Delete: `packages/cli/src/cli.ts`
- Delete: `packages/cli/src/cli.test.ts`

- [ ] **Step 1: Confirm the package has no desktop-only implementation dependencies**

Run:

```bash
rg -n "@git-ingest/cli|packages/cli|clipboardy" packages package.json .github README.md
```

Expected: matches are limited to the CLI files, root scripts, and documentation references already identified during brainstorming; desktop imports must remain `@git-ingest/core`.

- [ ] **Step 2: Delete only the CLI package files**

Remove the five files listed above. Do not modify `packages/core` or any file under `packages/desktop` in this task.

- [ ] **Step 3: Confirm the desktop dependency edge remains intact**

Run:

```bash
rg -n "@git-ingest/core" packages/desktop packages/core
```

Expected: desktop main/preload/validation/build/test configuration still references `@git-ingest/core`, and no desktop file references `@git-ingest/cli`.

- [ ] **Step 4: Commit the package deletion**

```bash
git add packages/cli/package.json packages/cli/tsconfig.json packages/cli/vitest.config.ts packages/cli/src/cli.ts packages/cli/src/cli.test.ts
git commit -m "refactor(workspace): remove standalone cli package"
```

### Task 2: Simplify root workspace commands

**Files:**

- Modify: `package.json:14-25`

- [ ] **Step 1: Update the root scripts**

Change the scripts to this exact shape:

```json
"build": "bun run --filter @git-ingest/core build && bun run --filter @git-ingest/desktop build",
"test": "bun run --filter @git-ingest/core test && bun run --filter @git-ingest/desktop test",
"test:smoke": "bun run --filter @git-ingest/desktop test:smoke",
"dev:desktop": "bun run --filter @git-ingest/desktop dev",
"build:desktop": "bun run --filter @git-ingest/desktop build",
"package:desktop": "bun run --filter @git-ingest/desktop package",
"ci:test": "bun run test && bun run test:smoke && bun run build",
"ci:package:desktop": "bun run package:desktop",
```

Remove the `build:cli` script. Keep the existing `dev`, formatting, and postinstall scripts unchanged.

- [ ] **Step 2: Validate script resolution before dependency regeneration**

Run:

```bash
bun run --filter @git-ingest/core test
bun run --filter @git-ingest/desktop test
```

Expected: both filters resolve to existing workspace packages; no CLI filter is attempted.

- [ ] **Step 3: Commit the root command changes**

```bash
git add package.json
git commit -m "chore(workspace): make root commands desktop-only"
```

### Task 3: Update current documentation and lockfile

**Files:**

- Modify: `README.md`
- Modify: `bun.lock`
- Modify: active operational documentation containing the current three-package architecture, if any is still presented as current after inspection.

- [ ] **Step 1: Update README package and command documentation**

Keep the existing desktop product behavior and screenshots. Change the workspace description to list only:

```markdown
| `@git-ingest/core`    | Shared project scanning, ignore handling, token estimation, and output generation. |
| `@git-ingest/desktop` | Secure Electron desktop app built with Electron, React, and electron-vite.         |
```

Remove any CLI-specific command or package description. Keep `bun run build`, `bun test`, `bun run test:smoke`, `bun run build:desktop`, and `bun run package:desktop` documented.

- [ ] **Step 2: Regenerate the Bun lockfile**

Run:

```bash
bun install
```

Expected: the workspace resolves with only `@git-ingest/core` and `@git-ingest/desktop` under `packages/*`; the CLI workspace and CLI-only dependency are removed from `bun.lock`.

- [ ] **Step 3: Search for remaining operational CLI references**

Run:

```bash
rg -n --hidden -g '!node_modules' -g '!dist' -g '!release' -g '!bun.lock' \
  "@git-ingest/cli|packages/cli|build:cli|clipboardy" \
  package.json packages .github README.md
```

Expected: no output. Historical design/plan documents may retain references to the former architecture and should not be changed unless they are active instructions.

- [ ] **Step 4: Commit documentation and lockfile changes**

```bash
git add README.md bun.lock
git commit -m "docs(desktop): remove cli workspace references"
```

### Task 4: Verify the desktop application and package artifacts

**Files:**

- Test: `packages/core/src/**/*.test.ts`
- Test: `packages/desktop/src/**/*.test.ts`
- Test: `packages/desktop/src/smoke/launch.test.ts`
- Output: `packages/desktop/release/*`

- [ ] **Step 1: Run the complete unit-test command**

Run:

```bash
bun run test
```

Expected: core and desktop unit tests pass; no CLI test suite is discovered or invoked.

- [ ] **Step 2: Run the workspace build**

Run:

```bash
bun run build
```

Expected: core compiles and Electron produces the existing desktop `out` bundles.

- [ ] **Step 3: Run the Electron smoke test**

Run:

```bash
bun run test:smoke
```

Expected: the built desktop application launches and the existing smoke assertions pass.

- [ ] **Step 4: Build desktop distribution artifacts**

Run:

```bash
bun run package:desktop
```

Expected: the existing macOS DMG and ZIP targets are produced under `packages/desktop/release/`; no CLI executable or separate CLI artifact is created.

- [ ] **Step 5: Inspect the final tree and artifact names**

Run:

```bash
test ! -e packages/cli
find packages/desktop/release -maxdepth 1 -type f -print
git status --short
```

Expected: `packages/cli` does not exist, release files are desktop artifacts only, and the working tree contains only intentional generated output or no changes depending on the repository's ignore rules.

- [ ] **Step 6: Finish without an empty verification commit**

If all checks pass, do not create an empty commit. If a check exposes a stale reference in a file already listed in Tasks 2 or 3, correct that file as part of the corresponding task and rerun the affected command before reporting completion.
