use serde::{Deserialize, Serialize};

pub const DEFAULT_MAX_FILE_SIZE_BYTES: u64 = 1_048_576;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum OutputFormat {
    #[default]
    Markdown,
    Text,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum FileOverrideMode {
    #[default]
    Auto,
    Include,
    Exclude,
    Pin,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileOverride {
    pub path: String,
    pub mode: FileOverrideMode,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectRequest {
    pub root_path: String,
    #[serde(default)]
    pub include_patterns: Vec<String>,
    #[serde(default)]
    pub exclude_patterns: Vec<String>,
    #[serde(default = "default_max_file_size")]
    pub max_file_size_bytes: u64,
    #[serde(default)]
    pub token_budget: Option<u64>,
    #[serde(default)]
    pub overrides: Vec<FileOverride>,
}

fn default_max_file_size() -> u64 { DEFAULT_MAX_FILE_SIZE_BYTES }

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GitSummary {
    pub branch: Option<String>,
    pub available: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub path: String,
    pub size_bytes: u64,
    pub language: String,
    pub estimated_tokens: u64,
    pub included: bool,
    pub pinned: bool,
    pub skip_reason: Option<String>,
    pub git_status: Option<String>,
    pub dependencies: Vec<String>,
    pub relevance_score: i64,
    pub relevance_reasons: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IgnoredDirectory {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionResult {
    pub root_path: String,
    pub project_name: String,
    pub git: GitSummary,
    pub entries: Vec<FileEntry>,
    pub ignored_directories: Vec<IgnoredDirectory>,
    pub included_files: usize,
    pub skipped_files: usize,
    pub total_bytes: u64,
    pub estimated_tokens: u64,
    pub budget_tokens: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateRequest {
    #[serde(flatten)]
    pub inspect: InspectRequest,
    pub format: OutputFormat,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationResult {
    pub output: String,
    pub format: OutputFormat,
    pub included_files: usize,
    pub skipped_files: usize,
    pub total_bytes: u64,
    pub approximate_tokens: u64,
}
