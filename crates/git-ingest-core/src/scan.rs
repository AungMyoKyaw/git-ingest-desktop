use crate::{
    binary, dependencies,
    error::{io, CoreError, Result},
    git, language,
    model::*,
    ranking, token,
};
use globset::{Glob, GlobSet, GlobSetBuilder};
use ignore::WalkBuilder;
use std::{
    collections::HashMap,
    fs,
    path::{Component, Path, PathBuf},
};

const GENERATED_DIRS: &[&str] = &[
    ".git",
    ".next",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
    "vendor",
];
const GENERATED_FILES: &[&str] = &["git-ingest-output.md", "git-ingest-output.txt"];

pub fn validate_root(root: &str) -> Result<PathBuf> {
    let path = Path::new(root);
    if !path.exists() {
        return Err(CoreError::MissingRoot(root.into()));
    }
    if !path.is_dir() {
        return Err(CoreError::NotDirectory(root.into()));
    }
    fs::canonicalize(path).map_err(|e| io(path, e))
}

fn compile(patterns: &[String]) -> Result<Option<GlobSet>> {
    if patterns.is_empty() {
        return Ok(None);
    }
    let mut b = GlobSetBuilder::new();
    for p in patterns {
        b.add(Glob::new(p).map_err(|e| CoreError::InvalidPattern {
            pattern: p.clone(),
            message: e.to_string(),
        })?);
    }
    Ok(Some(b.build().map_err(|e| CoreError::InvalidPattern {
        pattern: "<set>".into(),
        message: e.to_string(),
    })?))
}
fn normalize(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}
fn is_generated_dir(path: &Path) -> bool {
    path.components().any(|c| {
        c.as_os_str()
            .to_str()
            .is_some_and(|v| GENERATED_DIRS.contains(&v))
    })
}
fn override_mode(map: &HashMap<String, FileOverrideMode>, path: &str) -> FileOverrideMode {
    map.get(path).copied().unwrap_or_default()
}

pub fn inspect(request: &InspectRequest) -> Result<InspectionResult> {
    let root = validate_root(&request.root_path)?;
    let include = compile(&request.include_patterns)?;
    let exclude = compile(&request.exclude_patterns)?;
    let overrides: HashMap<_, _> = request
        .overrides
        .iter()
        .map(|o| (o.path.clone(), o.mode))
        .collect();
    let statuses = git::statuses(&root);
    let git_summary = git::summary(&root);
    let mut entries = Vec::new();
    let mut ignored = Vec::new();
    let walker = WalkBuilder::new(&root)
        .hidden(false)
        .standard_filters(true)
        .follow_links(false)
        .build();
    for item in walker {
        let entry = match item {
            Ok(v) => v,
            Err(_) => continue,
        };
        let path = entry.path();
        if path == root {
            continue;
        }
        let rel = match path.strip_prefix(&root) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let rels = normalize(rel);
        if entry.file_type().is_some_and(|t| t.is_dir()) {
            if is_generated_dir(rel) {
                ignored.push(IgnoredDirectory {
                    path: rels,
                    reason: "generated or dependency directory".into(),
                });
            }
            continue;
        }
        if !entry.file_type().is_some_and(|t| t.is_file()) {
            continue;
        }
        let mode = override_mode(&overrides, &rels);
        let metadata = fs::metadata(path).map_err(|e| io(path, e))?;
        let size = metadata.len();
        let language_name = language::detect_language(path).to_string();
        let git_status = statuses.get(&rels).cloned();
        let mut included = true;
        let mut skip = None;
        let forced = matches!(mode, FileOverrideMode::Include | FileOverrideMode::Pin);
        if mode == FileOverrideMode::Exclude {
            included = false;
            skip = Some("excluded by user".into());
        }
        if included && !forced {
            if let Some(set) = &include {
                if !set.is_match(&rels) {
                    included = false;
                    skip = Some("not matched by include rules".into());
                }
            }
            if included {
                if let Some(set) = &exclude {
                    if set.is_match(&rels) {
                        included = false;
                        skip = Some("matched exclude rules".into());
                    }
                }
            }
        }
        // Safety exclusions are absolute. User include/pin overrides may bypass
        // selection rules, but never generated output, dependency trees, size
        // limits, binary detection, or invalid text encoding.
        if GENERATED_FILES.contains(&rels.as_str()) {
            included = false;
            skip = Some("generated output".into());
        }
        if is_generated_dir(rel) {
            included = false;
            skip = Some("generated or dependency directory".into());
        }
        if size > request.max_file_size_bytes {
            included = false;
            skip = Some("file exceeds size limit".into());
        }

        let mut deps = Vec::new();
        let mut tokens = 0;
        if included {
            if binary::has_binary_extension(path) {
                included = false;
                skip = Some("binary file".into());
            } else {
                let bytes = fs::read(path).map_err(|e| io(path, e))?;
                if binary::looks_binary(&bytes) {
                    included = false;
                    skip = Some("binary file".into());
                } else {
                    match String::from_utf8(bytes) {
                        Ok(content) => {
                            tokens = token::estimate_tokens(&content);
                            deps = dependencies::extract_dependencies(&language_name, &content);
                        }
                        Err(_) => {
                            included = false;
                            skip = Some("non-UTF-8 file".into());
                        }
                    }
                }
            }
        }
        let pinned = mode == FileOverrideMode::Pin && included;
        let (score, reasons) = ranking::score(&rels, &language_name, git_status.as_deref(), mode);
        entries.push(FileEntry {
            path: rels,
            size_bytes: size,
            language: language_name,
            estimated_tokens: tokens,
            included,
            pinned,
            skip_reason: skip,
            git_status,
            dependencies: deps,
            relevance_score: score,
            relevance_reasons: reasons,
        });
    }
    ranking::apply_budget(&mut entries, request.token_budget);
    entries.sort_by(|a, b| a.path.cmp(&b.path));
    ignored.sort_by(|a, b| a.path.cmp(&b.path));
    ignored.dedup_by(|a, b| a.path == b.path);
    let included_files = entries.iter().filter(|e| e.included).count();
    let skipped_files = entries.len() - included_files;
    let total_bytes = entries
        .iter()
        .filter(|e| e.included)
        .map(|e| e.size_bytes)
        .sum();
    let estimated_tokens = entries
        .iter()
        .filter(|e| e.included)
        .map(|e| e.estimated_tokens)
        .sum();
    let project_name = root
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("project")
        .to_string();
    Ok(InspectionResult {
        root_path: root.display().to_string(),
        project_name,
        git: git_summary,
        entries,
        ignored_directories: ignored,
        included_files,
        skipped_files,
        total_bytes,
        estimated_tokens,
        budget_tokens: request.token_budget,
    })
}

pub fn read_project_file(root: &str, relative: &str, max_bytes: u64) -> Result<String> {
    let root = validate_root(root)?;
    let rel = Path::new(relative);
    if rel.is_absolute()
        || rel.components().any(|c| {
            matches!(
                c,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(CoreError::InvalidProjectPath(relative.into()));
    }
    let candidate = root.join(rel);
    let canonical = fs::canonicalize(&candidate).map_err(|e| io(&candidate, e))?;
    if !canonical.starts_with(&root) {
        return Err(CoreError::InvalidProjectPath(relative.into()));
    }
    let metadata = fs::metadata(&canonical).map_err(|e| io(&canonical, e))?;
    if !metadata.is_file() || metadata.len() > max_bytes {
        return Err(CoreError::InvalidProjectPath(relative.into()));
    }
    let bytes = fs::read(&canonical).map_err(|e| io(&canonical, e))?;
    if binary::looks_binary(&bytes) {
        return Err(CoreError::InvalidProjectPath(relative.into()));
    }
    String::from_utf8(bytes).map_err(|_| CoreError::InvalidProjectPath(relative.into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;
    fn req(root: &Path) -> InspectRequest {
        InspectRequest {
            root_path: root.display().to_string(),
            include_patterns: vec![],
            exclude_patterns: vec![],
            max_file_size_bytes: 1024,
            token_budget: None,
            overrides: vec![],
        }
    }
    #[test]
    fn rejects_missing_and_file_roots() {
        assert!(matches!(
            validate_root("/definitely/missing/git-ingest"),
            Err(CoreError::MissingRoot(_))
        ));
        let d = tempdir().unwrap();
        let p = d.path().join("f");
        fs::write(&p, "x").unwrap();
        assert!(matches!(
            validate_root(p.to_str().unwrap()),
            Err(CoreError::NotDirectory(_))
        ));
    }
    #[test]
    fn scans_filters_binary_size_budget_and_overrides() {
        let d = tempdir().unwrap();
        fs::create_dir(d.path().join("src")).unwrap();
        fs::write(d.path().join("src/a.rs"), "pub fn a() {}\n").unwrap();
        fs::write(d.path().join("README.md"), "hello").unwrap();
        fs::write(d.path().join("big.txt"), "x".repeat(2000)).unwrap();
        fs::write(d.path().join("bad.bin"), b"a\0b").unwrap();
        let mut r = req(d.path());
        r.exclude_patterns = vec!["**/*.md".into()];
        r.overrides = vec![
            FileOverride {
                path: "README.md".into(),
                mode: FileOverrideMode::Pin,
            },
            FileOverride {
                path: "big.txt".into(),
                mode: FileOverrideMode::Pin,
            },
            FileOverride {
                path: "bad.bin".into(),
                mode: FileOverrideMode::Include,
            },
        ];
        r.token_budget = Some(1);
        let out = inspect(&r).unwrap();
        assert!(
            out.entries
                .iter()
                .find(|e| e.path == "README.md")
                .unwrap()
                .included
        );
        assert!(
            !out.entries
                .iter()
                .find(|e| e.path == "big.txt")
                .unwrap()
                .included
        );
        assert_eq!(
            out.entries
                .iter()
                .find(|e| e.path == "big.txt")
                .unwrap()
                .skip_reason
                .as_deref(),
            Some("file exceeds size limit")
        );
        assert!(
            !out.entries
                .iter()
                .find(|e| e.path == "bad.bin")
                .unwrap()
                .included
        );
        assert_eq!(
            out.entries
                .iter()
                .find(|e| e.path == "bad.bin")
                .unwrap()
                .skip_reason
                .as_deref(),
            Some("binary file")
        );
    }
    #[test]
    fn rejects_invalid_glob() {
        let d = tempdir().unwrap();
        let mut r = req(d.path());
        r.include_patterns = vec!["[".into()];
        assert!(matches!(inspect(&r), Err(CoreError::InvalidPattern { .. })));
    }
    #[test]
    fn reads_only_safe_text_files() {
        let d = tempdir().unwrap();
        fs::write(d.path().join("a.txt"), "hello").unwrap();
        assert_eq!(
            read_project_file(d.path().to_str().unwrap(), "a.txt", 100).unwrap(),
            "hello"
        );
        assert!(read_project_file(d.path().to_str().unwrap(), "../x", 100).is_err());
        assert!(read_project_file(d.path().to_str().unwrap(), "a.txt", 1).is_err());
    }
}
