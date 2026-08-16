# Contributing

1. Fork or branch from `master`.
2. Install with `bun install --frozen-lockfile` and a Rust toolchain.
3. Keep repository processing local and preserve the renderer/native trust boundary.
4. Add behavior tests before production behavior changes.
5. Run `bun run verify` and `bun run audit` before opening a pull request.
6. Do not commit secrets, generated coverage, build output, local paths or skipped/focused tests.

Production dependencies require a clear need, compatibility/security review, and bundle/runtime-impact consideration. Prefer Rust/std/Tauri/Svelte platform capabilities over new packages.
