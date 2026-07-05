# Native Light Desktop UI Rewrite Design

Date: 2026-07-05

## Context

Git-Ingest is a local-first desktop utility that turns a selected project folder into AI-readable markdown or text. The existing Electron app already has the important production behavior: secure preload/main IPC, folder selection, drag-and-drop, preview, generation, cancellation, copy, save, open, reveal, recent project persistence, and settings persistence.

The target UI direction is the downloaded reference project at `/Users/aungmyokyaw/Downloads/git-ingest-light-native-desktop-ui`. That reference uses a light native desktop layout with app chrome, sidebar, central workspace, right inspector, and bottom status bar. This rewrite will adapt that structure into the existing Electron app while keeping the real behavior and security boundaries.

## Goals

- Rewrite the desktop renderer around a light native desktop shell.
- Preserve all existing real app behavior and IPC boundaries.
- Replace the current dark, card-heavy single-file renderer with focused React modules.
- Make the primary workflow obvious: choose project, preview contents, adjust rules, generate output, export or copy.
- Keep secondary views useful and modest instead of adding fake product scope.
- Improve scan/generation visibility with compact status, metrics, and inspector surfaces.

## Non-Goals

- Do not rewrite main-process IPC, core scan logic, or generation logic unless a renderer integration issue requires a narrow adjustment.
- Do not add remote services, account features, or any network-dependent behavior.
- Do not ship fake templates or large placeholder product areas.
- Do not add a landing page or marketing surface.
- Do not change CLI behavior.

## Recommended Approach

Use a native-shell renderer rewrite with real app wiring. The renderer should follow the reference architecture visually and structurally, but the data and actions must come from the existing Electron app instead of the prototype's mock store.

This is preferred over a direct prototype transplant because it avoids dead tabs and mock assumptions. It is also preferred over incremental restyling because the current single large `App.tsx` would keep the old workflow shape underneath the new palette.

## Architecture

The renderer should be split into focused modules:

- `packages/desktop/src/renderer/src/App.tsx`
  - Owns top-level hydration, IPC subscriptions, generation lifecycle, drag/drop selection, and app state coordination.
- `packages/desktop/src/renderer/src/features/ingest/model`
  - Holds UI state types, reducers or state helpers, formatting helpers, and mapping from real preview/generation results into view models.
- `packages/desktop/src/renderer/src/features/ingest/ui`
  - Holds `AppChrome`, `Sidebar`, `Workspace`, `Inspector`, `StatusBar`, and focused child components for preview, rules, output, run history, and settings.
- `packages/desktop/src/renderer/src/shared/ui`
  - Holds reusable button, metric card, section header, segmented control, table, and sheet primitives used by at least two renderer components.
- `packages/desktop/src/renderer/src/shared/icons`
  - Holds local icon components. Do not add an icon dependency for the first rewrite.
- `packages/desktop/src/renderer/src/styles.css`
  - Becomes the light native desktop design system and responsive layout layer.

The module boundaries should keep IPC and side effects near `App.tsx`, while leaf UI components receive props and callbacks. Components should be understandable without reading main-process code.

## Primary Workflow

The first screen is the app itself, not a landing page. The default `Projects` view drives the real workflow:

1. Choose or drop a project folder.
2. Automatically preview what will be included.
3. Adjust rules if needed.
4. Generate output.
5. Copy, save, open, or reveal the generated file.

When no folder is selected, the workspace shows a compact empty state with drag/drop and a `Choose Folder` action. When a folder is selected, it shows:

- Project header with name, path, local/safe badge, and primary generate action.
- Preview section with included files, skipped files, ignored directories, warnings, token estimate, output size, and top file types.
- Pipeline/status panel using real preview and generation phases.
- Output editor with generated markdown/text and clear empty/generated states.

## Rules Editing

Advanced rules should move out of the page-length expanded form and into a focused sheet or panel. It must preserve the current settings:

- Format: markdown or text.
- Max file size in MB.
- Include patterns.
- Exclude patterns.
- Persisted advanced open/closed state if it still maps cleanly to the new sheet behavior.

Rules changes should trigger the existing auto-preview behavior after hydration. Stale output should clear when selected project or rules change.

## Navigation

The sidebar should include:

- `Projects`: main workflow.
- `Runs`: local session history derived from successful generations in the current renderer session. It should not imply durable historical storage until that storage exists.
- `Settings`: compact preference view for current persisted settings.

`Templates` should not ship in the first rewrite unless it maps to real settings during implementation. If included later, each template must change actual generation settings or output behavior. It should not be a fake gallery.

Recent projects should remain available in the sidebar and should call the same selection path as choosing or dropping a folder.

## Inspector

The right inspector provides always-visible operational context:

- Preview metrics: included files, ignored files, estimated tokens, and estimated output size.
- Safety rows: local only, read-only scan, renderer has no direct filesystem access.
- Ignored directories and warnings.
- Actions: copy, save, open saved file, reveal in Finder or folder, clear output.
- Error display with user-facing message and expandable technical detail when available.

Actions should be disabled when their required data is unavailable. Save/open/reveal state should use the existing `savedFilePath` behavior.

## Visual System

The app should match the downloaded light native desktop direction:

- Full-height app window with centered desktop frame on large screens and edge-to-edge layout on small screens.
- Light macOS-style toolbar, sidebar, inspector, and status bar materials.
- Compact app typography, generally 11-17px for app chrome and panels.
- Neutral light palette with blue accent, green safety/success, red error, and amber warning.
- Dense native tables and inspector groups instead of oversized marketing cards.
- Rounded corners sized by role: smaller for controls, moderate for panels, no pill-heavy style unless representing badges.
- Icon-first buttons where icons clarify actions.
- Monospace output editor with stable height, scroll behavior, and no layout jumps.
- No dark gradient hero, decorative blob background, or marketing copy.

The UI should feel like a practical macOS developer utility: quiet, inspectable, compact, and local-first.

## Error Handling

- Drop errors should appear immediately and should not keep stale selected-folder assumptions.
- Preview errors should clear stale preview data and keep the selected project/rules visible.
- Generation errors should stop progress, keep the selected project/rules intact, and show the user-facing error.
- Save, open, and reveal failures should surface the main-process error message and detail.
- Warnings should remain visible near preview metrics and in the inspector.
- Cancellation should leave the app in a usable state and explain that generation was cancelled.

## State And Data Flow

- Hydrate persisted recent projects and settings through `window.gitIngest.getState()`.
- Keep request keys or equivalent stale-result protection so old previews cannot overwrite newer selections.
- Use existing generation progress and finished subscriptions.
- Continue to ignore generation progress events that do not match the active request id.
- Reset generated output and saved path when project or rules change.
- Avoid storing large generated output in more places than needed.

## Testing And Verification

Implementation should preserve and run existing tests:

- Main validators.
- File actions.
- Path helpers.
- Renderer drop handling.
- Smoke launch test where feasible.

Add focused renderer tests for new helpers or reducers if state mapping becomes non-trivial. Full visual regression is not required, but the desktop app should be manually inspected in these states:

- Empty/no folder.
- Folder selected with preview.
- Rules edited and preview refreshed.
- Generating with progress.
- Cancelled generation.
- Generated output with copy/save/open/reveal actions.
- Preview or generation error.
- Recent projects and settings views.

Verification commands:

```bash
bun test
bun run build:desktop
bun run test:smoke
```

If smoke testing is blocked by local environment constraints, record the exact blocker.

## Rollout Scope

This is one renderer rewrite. It should be implemented in a single coherent pass because the layout, state model, and CSS system are tightly related. The rewrite should avoid unrelated main-process changes and should not expand the product beyond the current local ingestion workflow.
