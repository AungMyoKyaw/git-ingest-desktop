# Git-Ingest v1 Design

## Direction

Precise, native, trustworthy. Git-Ingest is a developer utility, not a SaaS dashboard. The interface keeps context generation central and makes every inclusion/exclusion decision inspectable.

## Visual system

- Typography: macOS system stack with SF Mono-compatible code previews.
- Spacing: 4px base; primary rhythm 8/12/16/24/32px.
- Light: background `#F5F7FA`, primary `#3478F6`, secondary `#596579`, success `#2E9B67`.
- Dark: background `#111318`; surfaces step through `#181A1F` and `#24262B`.
- Radius: 8px controls, 12px major surfaces.
- No decorative illustration dependency; the existing app icon is retained to keep the package lightweight.

## Hierarchy

Four workspaces: Project, Context, Rules, Output. Context uses a repository list + preview split view. Rules use compact cards. Output remains a single generated artifact with explicit copy/save/open/reveal actions.

## Responsive behavior

At 850px and below the navigation collapses to labels-only compact width and Context stacks list above preview. Minimum desktop window is 720×520.

## Interaction states

Buttons expose hover/focus/disabled states. Loading changes action labels and disables generation. Empty and error states live in the workspace they affect. File inclusion, pinning, skip reason, Git status, and relevance reasons are textual; color is never the only signal.

## Accessibility

Semantic buttons/labels, keyboard shortcuts, visible 2px focus ring, reduced-motion respect, responsive text wrapping, and system light/dark color schemes. Target: WCAG AA contrast for text and controls.
