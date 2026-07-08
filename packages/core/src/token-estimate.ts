export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}
