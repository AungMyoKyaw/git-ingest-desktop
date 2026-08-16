# Release Flow
```mermaid
flowchart LR
  Commit --> CI[CI: format/lint/type/test/coverage/audit/build]
  CI --> Mac[macOS Tauri package]
  Mac --> Visual[Runtime + screenshot verification]
  Visual --> Tag[v1.0.0 tag]
  Tag --> Release[GitHub Release]
  Release --> Brew[Homebrew cask update]
```
Publishing requires the repository's signing/notarization secrets; unsigned local/CI packages are not represented as notarized.
