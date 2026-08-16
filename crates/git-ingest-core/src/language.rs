use std::path::Path;

pub fn detect_language(path: &Path) -> &'static str {
    let name = path.file_name().and_then(|v| v.to_str()).unwrap_or_default();
    if name.eq_ignore_ascii_case("Dockerfile") { return "Dockerfile"; }
    if name.eq_ignore_ascii_case("Makefile") { return "Makefile"; }
    match path.extension().and_then(|v| v.to_str()).unwrap_or_default().to_ascii_lowercase().as_str() {
        "ts" => "TypeScript", "tsx" => "TSX", "js" => "JavaScript", "jsx" => "JSX",
        "svelte" => "Svelte", "rs" => "Rust", "py" => "Python", "go" => "Go",
        "java" => "Java", "kt" | "kts" => "Kotlin", "swift" => "Swift", "rb" => "Ruby",
        "php" => "PHP", "cs" => "C#", "c" | "h" => "C", "cpp" | "cc" | "cxx" | "hpp" => "C++",
        "css" => "CSS", "scss" => "SCSS", "html" | "htm" => "HTML", "json" => "JSON",
        "toml" => "TOML", "yaml" | "yml" => "YAML", "md" | "mdx" => "Markdown",
        "sh" | "bash" | "zsh" => "Shell", "sql" => "SQL", "xml" => "XML", _ => "Text",
    }
}

pub fn fence_language(language: &str) -> &'static str {
    match language { "TypeScript" => "ts", "TSX" => "tsx", "JavaScript" => "js", "JSX" => "jsx", "Svelte" => "svelte", "Rust" => "rust", "Python" => "python", "Go" => "go", "Java" => "java", "Kotlin" => "kotlin", "Swift" => "swift", "Ruby" => "ruby", "PHP" => "php", "C#" => "csharp", "C" => "c", "C++" => "cpp", "CSS" => "css", "SCSS" => "scss", "HTML" => "html", "JSON" => "json", "TOML" => "toml", "YAML" => "yaml", "Markdown" => "markdown", "Shell" => "sh", "SQL" => "sql", "XML" => "xml", _ => "text" }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn detects_extensions_and_special_names() {
        assert_eq!(detect_language(Path::new("src/main.ts")), "TypeScript");
        assert_eq!(detect_language(Path::new("Dockerfile")), "Dockerfile");
        assert_eq!(detect_language(Path::new("unknown.xyz")), "Text");
    }
    #[test] fn maps_fences() { assert_eq!(fence_language("Rust"), "rust"); assert_eq!(fence_language("Other"), "text"); }
}
