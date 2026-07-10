---
name: release-git-ingest
description: Use when the user wants to release a new version of git-ingest-desktop — saying things like "release vX.Y.Z", "cut a release", "publish new version", "bump version and release", "tag and push release", or any mention of creating a new GitHub release for this project.
---

# Release Git-Ingest Desktop

## Overview

Releases the Electron desktop app via GitHub Actions. Pipeline builds macOS/Windows/Linux packages and publishes them to a GitHub Release automatically.

## When to Use

- User asks to release, publish, cut a release, or bump version
- User mentions tagging a new version
- User says "ship it", "push a release", "make a new build available"
- NOT for: publishing npm packages, deploying the product website (separate pipeline), or ad-hoc local builds

## Prerequisites

- Working tree is clean (`git status` — no dirty files)
- On `master` branch unless user says otherwise
- Any feature branches the user wants included are already merged (ask if unsure)

## Release Steps

### 1. Pick the new version

Current version is in `package.json`. Use semver: bump **patch** for bugfixes, **minor** for features, **major** for breaking changes.

Ask the user what version to bump to unless they already specified it.

### 2. (Optional) Merge feature branch

If a feature branch (e.g. `feat/desktop-mvp-alignment`) has unmerged commits, ask:
"Should I merge [branch] into master first before releasing?"

If yes:
```bash
git merge <branch>
git push origin master
```

### 3. Bump version in 3 files

All 3 must stay in sync:
- `package.json` (root workspace)
- `packages/core/package.json`
- `packages/desktop/package.json`

Edit the `"version": "X.Y.Z"` field in each one.

### 4. Commit & push

Use `--message` flag to avoid opening an editor:

```bash
git add package.json packages/core/package.json packages/desktop/package.json
git commit -m "chore: bump version to X.Y.Z"
git push origin master
```

### 5. Tag & push tag

Use `--message` flag to avoid opening an editor:

```bash
git tag vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

### 6. Verify the pipeline

Tell the user to monitor: https://github.com/AungMyoKyaw/git-ingest-desktop/actions

## What the Pipeline Does

Triggered by tag push `v*.*.*` (`.github/workflows/release.yml`):

1. **test** — runs `bun run test`, `bun run test:smoke`, `bun run build`
2. **release** — builds Electron packages for macOS (dmg/zip), Windows (nsis exe), Linux (AppImage/deb/rpm) using `electron-builder`
3. **publish** — creates GitHub Release and uploads all build artifacts

## Common Mistakes

- **Typing `git tag` without `-m`** — opens neovim editor which can crash in non-interactive shells. Always use `git tag vX.Y.Z -m "vX.Y.Z"`
- **Forgetting one package.json** — root + core + desktop all must match. Verify with:
  ```bash
  node -e "['./package.json','packages/core/package.json','packages/desktop/package.json'].forEach(f=>console.log(f+':',require('./'+f).version))"
  ```
- **Pushing tag before commit reaches origin** — the tag push triggers Actions, so make sure the commit is already on `origin/master` first
- **Tag already exists locally** — check with `git tag -l | grep vX.Y.Z` and delete with `git tag -d vX.Y.Z` if needed
- **Tag already exists remotely** — use `git push --delete origin vX.Y.Z` first, but avoid this unless absolutely necessary

## Verification

After the workflow completes, the release will appear at:
https://github.com/AungMyoKyaw/git-ingest-desktop/releases/tag/vX.Y.Z

Verify macOS `.dmg`, Windows `.exe`, and Linux `.AppImage`/`.deb` are all attached.
