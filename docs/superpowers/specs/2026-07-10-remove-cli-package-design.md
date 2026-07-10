# Remove CLI Package Design

## Goal

Make Git-Ingest a desktop-only application by deleting the standalone CLI workspace package while preserving the existing Electron application's behavior and the shared core package.

## Scope

### Remove

- `packages/cli/`, including its package manifest, source, tests, and Vitest configuration.
- The root `build:cli` script.
- CLI build and test filters from the root `build` and `test` scripts.
- CLI-only dependency and lockfile entries after dependency regeneration.
- CLI references in current README and operational project configuration.

### Preserve

- `packages/core` and its scanning, ignore, token-estimation, and output-generation behavior.
- `packages/desktop` and its Electron main/preload/renderer architecture.
- Existing desktop UI behavior: folder selection, drag-and-drop, preview, generation, cancellation, copy, save, open, reveal, recent-project persistence, and settings persistence.
- Desktop CI, smoke testing, and Electron Builder release targets, adjusted only where workspace package enumeration requires it.
- Historical planning documents that describe the former architecture, unless they are active operational instructions.

## Architecture and data flow

The resulting workspace remains a Bun monorepo containing `packages/core` and `packages/desktop`. The desktop main process continues to import `@git-ingest/core` directly through the existing IPC and generation paths. No replacement CLI adapter or compatibility package will be introduced.

Root commands will delegate only to the core and desktop packages. Electron packaging will continue to package the desktop application through `packages/desktop`; the removed CLI will not be bundled or published.

## Error handling

This change does not alter application error handling, validation, IPC contracts, or generation behavior. Dependency regeneration must fail loudly if a stale workspace reference remains, and repository searches must confirm no operational reference to `@git-ingest/cli` or `packages/cli` remains.

## Verification

Run the following after implementation:

1. `bun install`
2. `bun run test`
3. `bun run build`
4. `bun run test:smoke`
5. `bun run package:desktop`
6. Search operational files for CLI package references.
7. Inspect the generated desktop artifacts and confirm no CLI executable or package is produced.

The implementation is complete only when the desktop tests/build/smoke/package paths pass and the core package remains the desktop's only shared runtime dependency.
