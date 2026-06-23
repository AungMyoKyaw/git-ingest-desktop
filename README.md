# Git-Ingest

Git-Ingest is a local project-ingestion tool for AI workflows.

This workspace contains:

- `@git-ingest/core`: shared scan and output generation logic
- `@git-ingest/cli`: the `git-ingest` command-line wrapper
- `@git-ingest/desktop`: a secure Electron desktop app

## CLI usage

```bash
git-ingest /path/to/project --format markdown --copy
```

Options:

- `--format markdown|text`
- `--max-size <bytes>`
- `--include <pattern>` repeatable
- `--exclude <pattern>` repeatable
- `--output <file>`
- `--copy`

## Development

```bash
bun install
bun test
bun run test:smoke
bun run build
bun run dev
bun run dev:desktop
```

## CI commands

```bash
bun run ci:test
bun run ci:package:desktop
```

## Desktop packaging

```bash
bun run package:desktop
```

The desktop package is configured with platform icons for macOS (`.icns`), Windows (`.ico`), and Linux (`.png`).

Unsigned local builds work without extra setup. For signed and notarized macOS releases, provide the standard `electron-builder` environment variables such as `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

## Security

The desktop renderer does not access Node directly. Filesystem, dialogs, clipboard, and external-link handling are mediated through preload and main-process IPC.
