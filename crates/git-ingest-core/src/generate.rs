use crate::{
    error::Result,
    language::fence_language,
    model::*,
    scan::{inspect, read_project_file},
    token::estimate_tokens,
};

pub fn generate(request: &GenerateRequest) -> Result<GenerationResult> {
    let inspected = inspect(&request.inspect)?;
    let mut output = String::new();
    match request.format {
        OutputFormat::Markdown => {
            output.push_str("# Repository Context\n\n");
            output.push_str(&format!("Project: `{}`\n\n", inspected.project_name));
        }
        OutputFormat::Text => {
            output.push_str(&format!(
                "REPOSITORY CONTEXT\nPROJECT: {}\n\n",
                inspected.project_name
            ));
        }
    }
    for entry in inspected.entries.iter().filter(|e| e.included) {
        let content = read_project_file(
            &inspected.root_path,
            &entry.path,
            request.inspect.max_file_size_bytes,
        )?;
        match request.format {
            OutputFormat::Markdown => {
                output.push_str(&format!(
                    "## {}\n\n```{}\n{}",
                    entry.path,
                    fence_language(&entry.language),
                    content
                ));
                if !content.ends_with('\n') {
                    output.push('\n');
                }
                output.push_str("```\n\n");
            }
            OutputFormat::Text => {
                output.push_str(&format!("===== FILE: {} =====\n{}", entry.path, content));
                if !content.ends_with('\n') {
                    output.push('\n');
                }
                output.push('\n');
            }
        }
    }
    Ok(GenerationResult {
        approximate_tokens: estimate_tokens(&output),
        output,
        format: request.format,
        included_files: inspected.included_files,
        skipped_files: inspected.skipped_files,
        total_bytes: inspected.total_bytes,
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;
    fn request(root: &str, format: OutputFormat) -> GenerateRequest {
        GenerateRequest {
            inspect: InspectRequest {
                root_path: root.into(),
                include_patterns: vec![],
                exclude_patterns: vec![],
                max_file_size_bytes: 1024,
                token_budget: None,
                overrides: vec![],
            },
            format,
        }
    }
    #[test]
    fn markdown_and_text() {
        let d = tempdir().unwrap();
        fs::write(d.path().join("a.rs"), "fn main() {}\n").unwrap();
        let m = generate(&request(d.path().to_str().unwrap(), OutputFormat::Markdown)).unwrap();
        assert!(m.output.contains("## a.rs"));
        assert!(m.output.contains("```rust"));
        let t = generate(&request(d.path().to_str().unwrap(), OutputFormat::Text)).unwrap();
        assert!(t.output.contains("FILE: a.rs"));
        assert!(t.approximate_tokens > 0);
    }
}
