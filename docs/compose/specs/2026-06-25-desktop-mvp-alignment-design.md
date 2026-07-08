# Git-Ingest Desktop MVP Alignment Design

## [S1] Problem

The desktop app already has secure Electron plumbing, preview/generation IPC, recent-project persistence, and output actions. It does not yet match the product behavior and confidence-first UX in `/Users/aungmyokyaw/Downloads/git-ingest-design.md`.

The largest gaps are:

- preview is still a manual action instead of part of folder selection
- the main screen does not make included/ignored/tokens/output confidence obvious
- recent projects are present but not yet useful enough as a fast-start surface
- output actions depend on a user-initiated save path instead of clearly representing the latest generated result

## [S2] Goal

Align the existing desktop app with the design document's MVP while keeping the current secure architecture intact.

The implementation should make the main flow feel like:
`Choose Folder -> Auto Preview -> Generate -> Copy/Save/Open/Reveal`

## [S3] Non-Goals

- No cloud upload or AI API integration
- No broad component-library migration to Tailwind, shadcn/ui, or Radix in this pass
- No full renderer file-structure rewrite solely to mirror the aspirational design doc
- No V2-only features added just because they are mentioned in the design document

## [S4] Scope Decision

Use a focused MVP-alignment approach rather than a full renderer rewrite.

Keep the current working Electron/core structure and update only the pieces needed to satisfy the MVP behaviors and presentation:

- renderer state and interactions
- main/preload contracts where the UX needs more data
- minimal persistence changes for recent/generated project behavior
- focused CSS rewrite to reflect the proposed layout and hierarchy

Already-built extras such as drag-and-drop and cancel generation may remain if they do not complicate the MVP.

## [S5] Product Behavior

The desktop app should support these MVP behaviors:

- choosing a folder triggers preview automatically
- selecting a recent project triggers preview automatically
- preview communicates included files, ignored files, estimated tokens, and estimated output size
- generate remains the single dominant action once preview is ready
- copy, save, open file, and reveal in Finder are available after generation
- the app keeps a visible local-only trust signal
- advanced settings remain available without becoming the primary focus
- errors use plain-language product copy where possible

## [S6] Data And API Changes

Add only the smallest API/data extensions needed for the renderer to express the MVP:

- include an ignored-file count and token estimate in preview data, derived from existing core results
- persist enough generated-output metadata to enable open/reveal actions against the latest generated file path when generation writes a default output file
- expose a safe main-process action to open the detected Git remote only if the current project has one available, but this remains out of MVP scope for implementation unless it is nearly free

If a default generated output file does not exist today, prefer adding one stable app behavior over keeping output purely in-memory. The simplest acceptable path is to save generation results to a predictable temp/app-data location and surface that path in the generated state.

## [S7] Renderer State Changes

Refine the renderer around explicit app status instead of loosely coupled flags. The practical states are:

- empty
- previewing
- ready
- generating
- generated
- error

Implementation does not need a reducer unless the current component becomes hard to reason about. A small amount of derived state inside the existing `App.tsx` is preferred over introducing new abstractions.

## [S8] UI Structure

Rework the renderer into the layout implied by the design doc:

- header with product name, supporting copy, and local-only badge
- selected-project card with folder name/path and `Change Folder`, `Advanced`, `Generate`
- preview card with confidence metrics and ignored-summary context
- output card with an explicit empty state before generation and action buttons after generation
- recent-projects section that feels actionable rather than archival

The generate button should remain visually dominant. Preview should feel automatic and informative, not like a separate task.

## [S9] Interaction Rules

- choosing or dropping a folder clears stale output, enters previewing, and starts preview immediately
- changing advanced settings does not auto-generate output; preview may be manually refreshed or regenerated depending on the specific action taken
- while generating, folder-changing controls are disabled and cancel remains available if already implemented
- after generation, copy feedback is explicit and open/reveal actions reflect the most recent generated file when one exists
- missing recent-project paths should show a useful unavailable message instead of silently failing

## [S10] Implementation Notes

Expected files to change are concentrated in:

- `packages/desktop/src/renderer/src/App.tsx`
- `packages/desktop/src/renderer/src/styles.css`
- `packages/desktop/src/renderer/src/env.d.ts`
- `packages/desktop/src/preload/index.ts`
- `packages/desktop/src/main/ipc.ts`
- `packages/desktop/src/main/state.ts`
- `packages/desktop/src/main/generation.ts`

Prefer extending existing types and handlers over creating many new files. Split code only when a boundary becomes clearly reusable or unreadable.

## [S11] Verification

Verification must cover:

- desktop unit tests still passing
- full workspace tests still passing
- build success for the workspace

If the implementation changes generation persistence or renderer interaction rules, add or update focused tests only where behavior meaningfully changed.
