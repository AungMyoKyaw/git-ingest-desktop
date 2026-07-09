# Node.js Toolchain Refresh for Git-Ingest Desktop

**Date:** 2026-07-10
**Status:** Approved

## Motivation

Upgrade the entire build/release toolchain to use the latest Node.js runtime (Node 26) and matching tools, ensuring the project stays current with performance improvements, security patches, and latest language features.

## Changes

### 1. Version Bumps

#### Root `package.json`
| Field | From | To |
|-------|------|-----|
| `engines.node` | `>=22.12.0` | `>=26.0.0` |
| `engines.bun` | `>=1.1.0` | `>=1.2.0` |

#### Desktop `packages/desktop/package.json`
| Dep | From | To |
|-----|------|-----|
| `electron` | `^43.0.0` | latest stable (~44.x) |
| `electron-vite` | `^5.0.0` | latest `^5.x` |
| `electron-builder` | `^26.15.3` | latest `^26.x` |
| `vite` | `^8.1.3` | latest `^8.x` |
| `@vitejs/plugin-react` | `^6.0.3` | latest `^6.x` |
| `tailwindcss` | `^4.3.2` | latest `^4.x` |
| `@tailwindcss/vite` | `^4.3.2` | latest `^4.x` |
| `playwright` | `^1.61.1` | latest |
| `react` | `^19.2.7` | latest `^19.x` |
| `react-dom` | `^19.2.7` | latest `^19.x` |

No dependency changes for `core` or `cli` packages.

### 2. TypeScript Config

**`tsconfig.base.json`:**
- `target`: `ES2022` → `ES2026`
- `lib`: `["ES2022", "DOM"]` → `["ES2026", "DOM"]`
- `module`: stays `ESNext`
- `moduleResolution`: stays `Bundler`
- `strict`: stays `true`

Package-level tsconfigs: Unchanged (extend base).

### 3. electron-vite Config

**`packages/desktop/electron.vite.config.ts`:**

- **Main process**: Set `build.rollupOptions.output.format: 'es'` for ESM output
- **Preload**: Set `build.rollupOptions.output.format: 'es'` for ESM output
- **Renderer**: Add `build.rollupOptions.output.manualChunks` to split `react` + `react-dom` into a separate chunk

### 4. CI/CD

**`ci.yml`**: Add `actions/setup-node@v4` step with `node-version: 26` before Bun setup.

**`release.yml`**: Add `actions/setup-node@v4` step with `node-version: 26` in both `test` and `release` jobs.

### 5. electron-builder

No config changes needed. The existing `build` config in `packages/desktop/package.json` is already well-configured for multi-platform releases.

## Files Modified

- `/package.json` - engines and devDeps version bumps
- `/packages/desktop/package.json` - dependency version bumps
- `/tsconfig.base.json` - target and lib updates
- `/packages/desktop/electron.vite.config.ts` - ESM output + chunking
- `/.github/workflows/ci.yml` - Node.js setup step
- `/.github/workflows/release.yml` - Node.js setup step

## Verification

1. `bun install` - should succeed with no peer dependency conflicts
2. `bun run build` - should compile all packages (core, cli, desktop) without errors
3. `bun run test` - all unit tests pass
4. `bun run test:smoke` - Electron smoke test passes (launches and closes)
5. `bun run --filter @git-ingest/desktop package` - produces working DMG/ZIP on macOS
