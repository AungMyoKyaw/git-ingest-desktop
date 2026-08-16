mod binary;
mod dependencies;
mod error;
mod generate;
mod git;
mod language;
mod model;
mod ranking;
mod scan;
mod token;

pub use error::{CoreError, Result};
pub use generate::generate;
pub use git::diff as read_git_diff;
pub use model::*;
pub use scan::{inspect, read_project_file, validate_root};
