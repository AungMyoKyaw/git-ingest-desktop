import { describe, expect, test } from "vitest";
import {
  addRecentProject,
  budgetPercent,
  defaultPersistedState,
  filterEntries,
  formatBytes,
  formatPatterns,
  formatTokenCount,
  normalizeError,
  overrideFor,
  parsePatterns,
  setOverride,
  shortcutAction,
  toggleIncluded,
  togglePin,
  upsertProfile
} from "./model";
import type { FileEntry, SavedProfile } from "./types";
const entry = (partial: Partial<FileEntry> = {}): FileEntry => ({
  path: "src/main.ts",
  sizeBytes: 1200,
  language: "TypeScript",
  estimatedTokens: 300,
  included: true,
  pinned: false,
  skipReason: null,
  gitStatus: null,
  dependencies: [],
  relevanceScore: 30,
  relevanceReasons: ["source file"],
  ...partial
});
describe("model helpers", () => {
  test("parses and formats unique patterns", () => {
    expect(parsePatterns("src/**, docs/**\nsrc/**")).toEqual(["src/**", "docs/**"]);
    expect(formatPatterns(["a", "b"])).toBe("a\nb");
  });
  test("manages overrides", () => {
    let values = setOverride([], "a", "include");
    expect(overrideFor(values, "a")).toBe("include");
    values = setOverride(values, "a", "auto");
    expect(values).toEqual([]);
    expect(overrideFor(values, "a")).toBe("auto");
    expect(toggleIncluded([], entry({ path: "a", included: true }))).toEqual([
      { path: "a", mode: "exclude" }
    ]);
    expect(toggleIncluded([], entry({ path: "a", included: false }))).toEqual([
      { path: "a", mode: "include" }
    ]);
    expect(togglePin([], entry({ path: "a" }))).toEqual([{ path: "a", mode: "pin" }]);
    expect(togglePin([{ path: "a", mode: "pin" }], entry({ path: "a", pinned: true }))).toEqual([]);
  });
  test("filters repository entries", () => {
    const values = [
      entry(),
      entry({ path: "README.md", language: "Markdown", gitStatus: "M" }),
      entry({ path: "tests/app.spec.ts", included: false, skipReason: "excluded" })
    ];
    expect(filterEntries(values, "read", "all")).toHaveLength(1);
    expect(filterEntries(values, "", "included")).toHaveLength(2);
    expect(filterEntries(values, "", "changed")).toHaveLength(1);
    expect(filterEntries(values, "", "source")).toHaveLength(2);
    expect(filterEntries(values, "", "docs")).toHaveLength(1);
    expect(filterEntries(values, "", "tests")).toHaveLength(1);
    expect(filterEntries(values, "", "skipped")).toHaveLength(1);
  });
  test("formats metrics", () => {
    expect(formatBytes(10)).toBe("10 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
    expect(formatTokenCount(999)).toBe("999");
    expect(formatTokenCount(1234)).toBe("1.2k");
    expect(budgetPercent(50, 100)).toBe(50);
    expect(budgetPercent(200, 100)).toBe(100);
    expect(budgetPercent(20, null)).toBe(0);
  });
  test("maintains recent projects and profiles", () => {
    expect(addRecentProject(["b", "a"], "a")).toEqual(["a", "b"]);
    const p: SavedProfile = {
      id: "1",
      name: "One",
      includePatterns: [],
      excludePatterns: [],
      maxFileSizeBytes: 1,
      tokenBudget: null,
      format: "markdown"
    };
    expect(upsertProfile([], p)).toEqual([p]);
    expect(upsertProfile([p], { ...p, name: "Updated" })[0].name).toBe("Updated");
  });
  test("normalizes errors, shortcuts, and defaults", () => {
    expect(normalizeError(new Error("bad"))).toBe("bad");
    expect(normalizeError("bad2")).toBe("bad2");
    expect(normalizeError({})).toBe("Unexpected error");
    expect(shortcutAction({ key: "g", metaKey: true })).toBe("generate");
    expect(shortcutAction({ key: "o", ctrlKey: true })).toBe("choose");
    expect(shortcutAction({ key: ",", metaKey: true })).toBe("rules");
    expect(shortcutAction({ key: "f", metaKey: true })).toBe("search");
    expect(shortcutAction({ key: "x", metaKey: true })).toBeNull();
    expect(shortcutAction({ key: "g" })).toBeNull();
    expect(defaultPersistedState().settings.selectedPreset).toBe("general");
  });
});
