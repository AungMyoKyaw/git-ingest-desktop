use std::path::Path;
const EXTENSIONS: &[&str] = &["7z","a","avi","bmp","class","dmg","doc","docx","eot","exe","gif","gz","ico","icns","jar","jpeg","jpg","mov","mp3","mp4","o","otf","pdf","png","ppt","pptx","rar","so","tar","ttf","wav","webm","webp","woff","woff2","xls","xlsx","zip"];
pub fn has_binary_extension(path: &Path) -> bool {
    let ext = path.extension().and_then(|v| v.to_str()).unwrap_or_default().to_ascii_lowercase();
    EXTENSIONS.contains(&ext.as_str())
}
pub fn looks_binary(bytes: &[u8]) -> bool { bytes.iter().take(8192).any(|b| *b == 0) }
#[cfg(test)] mod tests { use super::*; #[test] fn detects_ext() { assert!(has_binary_extension(Path::new("a.png"))); assert!(!has_binary_extension(Path::new("a.rs"))); } #[test] fn detects_nulls() { assert!(looks_binary(b"a\0b")); assert!(!looks_binary(b"abc")); } }
