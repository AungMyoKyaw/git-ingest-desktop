# Git-Ingest Tauri + Svelte v1 Rewrite Design

The approved v1.0.0 rewrite preserves the existing local folder → preview → generate → copy/save workflow while replacing Electron/React with Tauri 2.11.5, Rust, Svelte 5.56.9 and Vite. It adds three cohesive expansion areas: deterministic LLM-context quality, repository exploration, and workflow automation.

The Rust core owns filesystem scanning, ignore rules, Git metadata/diffs, file safety, dependency hints, relevance ranking, token-budget selection and output generation. Tauri owns the narrow native command boundary, persisted settings/profiles, file watching and export/open/reveal operations. Svelte owns UI state and rendering only.

Security: no renderer filesystem plugin, no shell plugin, no remote/model API, no telemetry, no arbitrary command execution. Pinned files may exceed a token budget but unsafe/binary/path-escaping files may not bypass safety checks.

UI: four workspaces (Project, Context, Rules, Output), native macOS utility density, system light/dark, responsive 720×520 minimum, keyboard navigation and WCAG-AA-oriented status communication.
