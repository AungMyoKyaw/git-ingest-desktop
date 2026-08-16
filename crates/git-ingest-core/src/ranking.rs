use crate::model::{FileEntry, FileOverrideMode};

pub fn score(
    path: &str,
    language: &str,
    git_status: Option<&str>,
    mode: FileOverrideMode,
) -> (i64, Vec<String>) {
    let lower = path.to_ascii_lowercase();
    let mut value = 0i64;
    let mut reasons = Vec::new();
    if mode == FileOverrideMode::Pin {
        value += 1000;
        reasons.push("pinned by user".into());
    }
    if mode == FileOverrideMode::Include {
        value += 500;
        reasons.push("included by user".into());
    }
    if git_status.is_some() {
        value += 80;
        reasons.push("changed in Git".into());
    }
    if lower.ends_with("readme.md")
        || lower.ends_with("cargo.toml")
        || lower.ends_with("package.json")
    {
        value += 45;
        reasons.push("project entry point".into());
    }
    if !matches!(language, "Markdown" | "Text" | "JSON" | "YAML" | "TOML") {
        value += 30;
        reasons.push("source file".into());
    }
    if lower.contains("test") || lower.contains("spec") {
        value += 10;
        reasons.push("test coverage".into());
    }
    if language == "Markdown" {
        value += 8;
        reasons.push("documentation".into());
    }
    if reasons.is_empty() {
        reasons.push("repository file".into());
    }
    (value, reasons)
}

pub fn apply_budget(entries: &mut [FileEntry], budget: Option<u64>) {
    let Some(budget) = budget else {
        return;
    };
    let mut order: Vec<usize> = (0..entries.len())
        .filter(|i| entries[*i].included)
        .collect();
    order.sort_by(|a, b| {
        entries[*b]
            .pinned
            .cmp(&entries[*a].pinned)
            .then(
                entries[*b]
                    .relevance_score
                    .cmp(&entries[*a].relevance_score),
            )
            .then(entries[*a].path.cmp(&entries[*b].path))
    });
    let mut used: u64 = 0;
    for i in order {
        let cost = entries[i].estimated_tokens;
        if entries[i].pinned || used.saturating_add(cost) <= budget {
            used = used.saturating_add(cost);
        } else {
            entries[i].included = false;
            entries[i].skip_reason = Some("token budget".into());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::FileEntry;
    fn entry(path: &str, t: u64, pin: bool, score: i64) -> FileEntry {
        FileEntry {
            path: path.into(),
            size_bytes: 1,
            language: "Rust".into(),
            estimated_tokens: t,
            included: true,
            pinned: pin,
            skip_reason: None,
            git_status: None,
            dependencies: vec![],
            relevance_score: score,
            relevance_reasons: vec![],
        }
    }
    #[test]
    fn scoring_explains_priority() {
        let (s, r) = score("README.md", "Markdown", Some("M"), FileOverrideMode::Pin);
        assert!(s > 1000);
        assert!(r.contains(&"pinned by user".into()));
    }
    #[test]
    fn budget_keeps_pins_and_best() {
        let mut e = vec![
            entry("a", 10, false, 1),
            entry("b", 10, false, 9),
            entry("p", 100, true, 0),
        ];
        apply_budget(&mut e, Some(10));
        assert!(e[2].included);
        assert!(e[1].included);
        assert!(!e[0].included);
    }
}
