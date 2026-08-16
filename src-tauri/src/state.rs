use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedProfile {
    pub id: String,
    pub name: String,
    pub include_patterns: Vec<String>,
    pub exclude_patterns: Vec<String>,
    pub max_file_size_bytes: u64,
    pub token_budget: Option<u64>,
    pub format: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub appearance: String,
    pub live_refresh: bool,
    pub selected_preset: String,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            appearance: "system".into(),
            live_refresh: false,
            selected_preset: "general".into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PersistedState {
    pub recent_projects: Vec<String>,
    pub profiles: Vec<SavedProfile>,
    pub settings: Settings,
    pub last_export_path: Option<String>,
}

pub fn load(path: &Path) -> Result<PersistedState, String> {
    if !path.exists() {
        return Ok(PersistedState::default());
    }
    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}
pub fn save(path: &Path, state: &PersistedState) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let temp = path.with_extension("json.tmp");
    fs::write(
        &temp,
        serde_json::to_vec_pretty(state).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    fs::rename(temp, path).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    #[test]
    fn missing_is_default_and_roundtrips() {
        let d = tempdir().unwrap();
        let p = d.path().join("state.json");
        assert_eq!(load(&p).unwrap(), PersistedState::default());
        let mut s = PersistedState::default();
        s.recent_projects.push("/tmp/demo".into());
        save(&p, &s).unwrap();
        assert_eq!(load(&p).unwrap(), s);
    }
}
