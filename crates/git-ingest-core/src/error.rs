use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("project root does not exist: {0}")]
    MissingRoot(String),
    #[error("project root is not a directory: {0}")]
    NotDirectory(String),
    #[error("I/O error at {path}: {source}")]
    Io {
        path: String,
        #[source]
        source: std::io::Error,
    },
    #[error("invalid glob pattern `{pattern}`: {message}")]
    InvalidPattern { pattern: String, message: String },
    #[error("invalid project path: {0}")]
    InvalidProjectPath(String),
}

pub type Result<T> = std::result::Result<T, CoreError>;

pub(crate) fn io(path: &Path, source: std::io::Error) -> CoreError {
    CoreError::Io {
        path: path.display().to_string(),
        source,
    }
}
