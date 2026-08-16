use std::collections::BTreeSet;

pub fn extract_dependencies(language: &str, content: &str) -> Vec<String> {
    let mut out = BTreeSet::new();
    for line in content.lines().map(str::trim) {
        match language {
            "TypeScript" | "TSX" | "JavaScript" | "JSX" | "Svelte" => {
                if line.starts_with("import ") || line.starts_with("export ") {
                    if let Some(v) =
                        quoted_after(line, " from ").or_else(|| quoted_after(line, "import "))
                    {
                        out.insert(v);
                    }
                } else if let Some(start) = line.find("require(") {
                    if let Some(v) = first_quoted(&line[start + 8..]) {
                        out.insert(v);
                    }
                }
            }
            "Rust" => {
                if let Some(rest) = line.strip_prefix("mod ") {
                    out.insert(rest.trim_end_matches(';').to_string());
                }
                if let Some(rest) = line.strip_prefix("use crate::") {
                    out.insert(
                        rest.split("::")
                            .next()
                            .unwrap_or(rest)
                            .trim_end_matches(';')
                            .to_string(),
                    );
                }
            }
            "Python" => {
                if let Some(rest) = line.strip_prefix("from ") {
                    if let Some(v) = rest.split_whitespace().next() {
                        out.insert(v.to_string());
                    }
                } else if let Some(rest) = line.strip_prefix("import ") {
                    if let Some(v) = rest.split(',').next() {
                        out.insert(v.trim().to_string());
                    }
                }
            }
            _ => {}
        }
    }
    out.into_iter().collect()
}
fn quoted_after(line: &str, needle: &str) -> Option<String> {
    line.find(needle)
        .and_then(|idx| first_quoted(&line[idx + needle.len()..]))
}
fn first_quoted(text: &str) -> Option<String> {
    let q = text.char_indices().find(|(_, c)| *c == '\'' || *c == '"')?;
    let rest = &text[q.0 + 1..];
    let end = rest.find(q.1)?;
    Some(rest[..end].to_string())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn extracts_web() {
        assert_eq!(
            extract_dependencies("TypeScript", "import x from './x';\nconst y=require(\"z\")"),
            vec!["./x", "z"]
        );
    }
    #[test]
    fn extracts_rust_python() {
        assert_eq!(
            extract_dependencies("Rust", "mod scan;\nuse crate::model::X;"),
            vec!["model", "scan"]
        );
        assert_eq!(
            extract_dependencies("Python", "from pathlib import Path\nimport os"),
            vec!["os", "pathlib"]
        );
    }
}
