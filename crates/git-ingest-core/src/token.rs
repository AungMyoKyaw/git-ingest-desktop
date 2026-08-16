pub fn estimate_tokens(text: &str) -> u64 {
    if text.is_empty() {
        0
    } else {
        (text.chars().count() as u64).div_ceil(4)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn handles_empty() {
        assert_eq!(estimate_tokens(""), 0);
    }
    #[test]
    fn rounds_up() {
        assert_eq!(estimate_tokens("hello"), 2);
    }
}
