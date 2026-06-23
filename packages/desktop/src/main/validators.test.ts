import { describe, expect, it } from "vitest";
import { validateSafeExternalUrl, validateScanPayload } from "./validators";

describe("validateScanPayload", () => {
  it("rejects invalid folder payloads", () => {
    expect(() =>
      validateScanPayload({
        rootPath: 123,
        format: "markdown",
        maxFileSizeBytes: 100,
        includePatterns: [],
        excludePatterns: []
      })
    ).toThrow();
  });

  it("rejects invalid format", () => {
    expect(() =>
      validateScanPayload({
        rootPath: "/tmp/project",
        format: "pdf",
        maxFileSizeBytes: 100,
        includePatterns: [],
        excludePatterns: []
      })
    ).toThrow();
  });

  it("accepts valid payload", () => {
    expect(
      validateScanPayload({
        rootPath: "/tmp/project",
        format: "markdown",
        maxFileSizeBytes: 100,
        includePatterns: ["*.ts"],
        excludePatterns: ["dist/**"]
      })
    ).toEqual({
      rootPath: "/tmp/project",
      format: "markdown",
      maxFileSizeBytes: 100,
      includePatterns: ["*.ts"],
      excludePatterns: ["dist/**"]
    });
  });
});

describe("validateSafeExternalUrl", () => {
  it("allows https links", () => {
    expect(validateSafeExternalUrl("https://github.com")).toBe("https://github.com/");
  });

  it("rejects insecure links", () => {
    expect(() => validateSafeExternalUrl("http://example.com")).toThrow();
  });
});
