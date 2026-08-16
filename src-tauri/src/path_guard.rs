use std::{
    fs,
    path::{Component, Path, PathBuf},
};

pub fn safe_relative_path(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let rel = Path::new(relative);
    if rel.is_absolute()
        || rel.components().any(|c| {
            matches!(
                c,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err("path must stay inside the selected project".into());
    }
    let candidate = root.join(rel);
    let canonical = fs::canonicalize(&candidate).map_err(|e| e.to_string())?;
    let canonical_root = fs::canonicalize(root).map_err(|e| e.to_string())?;
    if !canonical.starts_with(&canonical_root) {
        return Err("path escaped selected project".into());
    }
    Ok(canonical)
}

pub fn writable_export_path(path: &Path) -> Result<PathBuf, String> {
    let ext = path
        .extension()
        .and_then(|v| v.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(ext.as_str(), "md" | "txt") {
        return Err("exports must be .md or .txt".into());
    }
    let parent = path
        .parent()
        .ok_or_else(|| "export path has no parent".to_string())?;
    let parent = fs::canonicalize(parent).map_err(|e| e.to_string())?;
    Ok(parent.join(
        path.file_name()
            .ok_or_else(|| "export path has no file name".to_string())?,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;
    #[test]
    fn guards_project_paths() {
        let d = tempdir().unwrap();
        fs::write(d.path().join("a.txt"), "x").unwrap();
        assert!(safe_relative_path(d.path(), "a.txt").is_ok());
        assert!(safe_relative_path(d.path(), "../a.txt").is_err());
    }
    #[test]
    fn guards_export_extensions() {
        let d = tempdir().unwrap();
        assert!(writable_export_path(&d.path().join("out.md")).is_ok());
        assert!(writable_export_path(&d.path().join("out.exe")).is_err());
    }
}
