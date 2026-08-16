use crate::model::GitSummary;
use std::{collections::HashMap, path::Path, process::Command};

fn run(root: &Path, args: &[&str]) -> Option<String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .env("GIT_OPTIONAL_LOCKS", "0")
        .output()
        .ok()?;
    output
        .status
        .success()
        .then(|| String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn summary(root: &Path) -> GitSummary {
    let branch = run(root, &["branch", "--show-current"]);
    GitSummary {
        available: branch.is_some(),
        branch: branch.filter(|v| !v.is_empty()),
    }
}

pub fn statuses(root: &Path) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let Some(text) = run(root, &["status", "--porcelain=v1", "--untracked-files=all"]) else {
        return map;
    };
    for line in text.lines() {
        if line.len() < 4 {
            continue;
        }
        let status = line[..2].trim().to_string();
        let mut path = line[3..].trim().to_string();
        if let Some((_, target)) = path.rsplit_once(" -> ") {
            path = target.to_string();
        }
        map.insert(path.replace('\\', "/"), status);
    }
    map
}

pub fn diff(root: &Path, relative: &str) -> Option<String> {
    if relative.starts_with('-') || relative.contains('\0') {
        return None;
    }
    run(root, &["diff", "--no-ext-diff", "--", relative])
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;
    fn repo() -> tempfile::TempDir {
        let d = tempdir().unwrap();
        assert!(Command::new("git")
            .args(["init", "-q"])
            .current_dir(d.path())
            .status()
            .unwrap()
            .success());
        assert!(Command::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(d.path())
            .status()
            .unwrap()
            .success());
        assert!(Command::new("git")
            .args(["config", "user.name", "Test"])
            .current_dir(d.path())
            .status()
            .unwrap()
            .success());
        fs::write(d.path().join("a.txt"), "one\n").unwrap();
        assert!(Command::new("git")
            .args(["add", "."])
            .current_dir(d.path())
            .status()
            .unwrap()
            .success());
        assert!(Command::new("git")
            .args(["commit", "-qm", "init"])
            .current_dir(d.path())
            .status()
            .unwrap()
            .success());
        d
    }
    #[test]
    fn reads_summary_status_and_diff() {
        let d = repo();
        let s = summary(d.path());
        assert!(s.available);
        fs::write(d.path().join("a.txt"), "two\n").unwrap();
        assert_eq!(
            statuses(d.path()).get("a.txt").map(String::as_str),
            Some("M")
        );
        assert!(diff(d.path(), "a.txt").unwrap().contains("two"));
    }
    #[test]
    fn is_safe_for_non_repo_and_bad_path() {
        let d = tempdir().unwrap();
        assert!(!summary(d.path()).available);
        assert!(statuses(d.path()).is_empty());
        assert_eq!(diff(d.path(), "--help"), None);
    }
}
