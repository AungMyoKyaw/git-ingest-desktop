# Changelog

## 1.0.0 — 2026-08-16

- Rebuilt Git-Ingest from Electron/React to Tauri 2, Rust and Svelte 5.
- Moved repository scanning, filtering, Git inspection, relevance ranking, token budgeting and context generation into a local Rust core.
- Added repository search/preview/diff exploration, explicit include/exclude/pin state and relevance explanations.
- Added workflow presets, reusable profiles, recent projects, keyboard shortcuts and optional live refresh.
- Added Markdown/plain-text generation plus copy/save/open/reveal handoff.
- Adopted least-privilege Tauri capabilities, strict test/coverage gates, architecture documentation and multi-stage GitHub CI/release workflows.
