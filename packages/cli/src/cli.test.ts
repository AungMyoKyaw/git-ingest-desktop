import { describe, expect, it } from "vitest";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  it("defaults to markdown", () => {
    const result = parseArgs(["/tmp/project"]);
    expect(result.format).toBe("markdown");
  });

  it("parses include and exclude flags", () => {
    const result = parseArgs([
      "/tmp/project",
      "--include",
      "*.ts",
      "--exclude",
      "dist/**",
      "--copy"
    ]);

    expect(result.includePatterns).toEqual(["*.ts"]);
    expect(result.excludePatterns).toEqual(["dist/**"]);
    expect(result.shouldCopy).toBe(true);
  });
});
