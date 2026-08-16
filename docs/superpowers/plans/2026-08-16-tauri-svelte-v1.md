# Git-Ingest Tauri + Svelte v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild and release Git-Ingest Desktop v1.0.0 with Tauri, Rust and Svelte while preserving existing behavior and adding context intelligence, repository exploration and workflow automation.

**Architecture:** A pure Rust domain crate performs local repository analysis and generation. A narrow Tauri layer exposes validated commands and persistence. Svelte renders the four-workspace desktop UI and never receives arbitrary filesystem or shell capabilities.

**Tech Stack:** Tauri 2.11.5, Rust stable 1.97.1, Svelte 5.56.9, Vite 8, Bun 1.3.14, Vitest 4, GitHub Actions.

## Global Constraints

- Local-only repository processing; no model API, account, analytics, telemetry, or arbitrary shell execution.
- Preserve Bun package-manager strategy.
- 100% statement/branch/function/line coverage for project-owned executable code is the release gate.
- Zero skipped, disabled, todo, focused-only, or ignored required tests.
- Least-privilege Tauri capabilities.
- Release version 1.0.0.

### Task 1: Reproducible Tauri/Svelte scaffold

- [x] Replace Electron/React production structure with root Bun/Vite/Svelte and Cargo workspace manifests.
- [x] Pin verified framework/tool versions and add formatter/lint/type/test/build commands.
- [ ] Regenerate Bun/Cargo locks on CI and verify frozen installation.

### Task 2: Rust context engine

- [x] Add typed request/result models and errors.
- [x] Add secure root/path handling, ignore-aware scanning, binary/size/UTF-8 filtering.
- [x] Add Git status/diff, dependency hints, deterministic relevance scoring and token budgeting.
- [x] Add Markdown/plain-text generation and behavior tests.

### Task 3: Tauri native boundary

- [x] Add least-privilege commands, persistence, export guards and optional file watcher.
- [x] Configure capabilities without generic filesystem or shell access.
- [ ] Compile and test native boundary on Linux/macOS CI.

### Task 4: Svelte model and native client

- [x] Add typed client, presets, overrides, filters, shortcuts and persistence helpers.
- [x] Add tests around model behavior and Tauri adapters.

### Task 5: Svelte desktop UI

- [x] Build Project, Context, Rules and Output workspaces.
- [x] Add responsive/dark/focus/error/empty/loading states and user-journey tests.
- [ ] Capture visual evidence at compact, normal and expanded sizes.

### Task 6: Open-source and CI hardening

- [x] Add Design.md, architecture diagrams, README/contributor/security/change docs.
- [x] Add CI/release workflows with frozen dependency installation and zero-skip checks.
- [ ] Validate workflow execution and dependency audit.

### Task 7: Full Release Ralph Loop

- [ ] Run clean/frozen install, formatting, lint, type checking, tests, skip scan, 100% coverage, build, packaging, audits, measurements and visual verification.
- [ ] Fix every in-scope FAIL and rerun affected gates.

### Task 8: Bundle and publish

- [ ] Create/verify/clone-test `git-ingest-desktop-v1.0.0.bundle`.
- [ ] Publish verified branch/tag/release and Homebrew cask when credentials/signing state permit.
