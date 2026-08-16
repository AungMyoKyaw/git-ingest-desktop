# Security Policy

## Supported version

Security fixes target the current v1 release line.

## Reporting

Please use GitHub's private vulnerability reporting feature for this repository rather than opening a public issue with exploit details.

## Security model

- Repository processing is local-only.
- The Svelte renderer has no generic filesystem or shell capability.
- Rust validates roots and relative paths before reads/diffs/exports.
- Git is invoked directly with fixed argument arrays, never through a shell.
- Export operations are limited to user-selected `.md`/`.txt` paths.
- No telemetry, account, analytics, remote model API, or secret storage exists in v1.
