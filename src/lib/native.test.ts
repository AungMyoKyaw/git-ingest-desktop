import { beforeEach, describe, expect, test, vi } from "vitest";
const invoke = vi.fn();
const open = vi.fn();
const save = vi.fn();
const writeText = vi.fn();
const listen = vi.fn();
const onDragDropEvent = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open, save }));
vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({ writeText }));
vi.mock("@tauri-apps/api/event", () => ({ listen }));
vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({ onDragDropEvent })
}));
import { createNativeClient } from "./native";
describe("native client", () => {
  beforeEach(() => vi.clearAllMocks());
  test("wraps project selection and commands", async () => {
    open.mockResolvedValue("/repo");
    invoke.mockResolvedValue({});
    const c = createNativeClient();
    expect(await c.chooseProject()).toBe("/repo");
    expect(invoke).not.toHaveBeenCalledWith("chooseProject");
    await c.inspect({
      rootPath: "/repo",
      includePatterns: [],
      excludePatterns: [],
      maxFileSizeBytes: 1,
      tokenBudget: null,
      overrides: []
    });
    expect(invoke).toHaveBeenCalledWith("inspect_project", { request: expect.any(Object) });
    await c.preview("/repo", "a");
    await c.diff("/repo", "a");
    await c.generate({
      rootPath: "/repo",
      includePatterns: [],
      excludePatterns: [],
      maxFileSizeBytes: 1,
      tokenBudget: null,
      overrides: [],
      format: "markdown"
    });
    await c.loadState();
    await c.saveState({
      recentProjects: [],
      profiles: [],
      settings: { appearance: "system", liveRefresh: false, selectedPreset: "general" },
      lastExportPath: null
    });
    expect(invoke.mock.calls.map((v) => v[0])).toEqual(
      expect.arrayContaining([
        "preview_file",
        "git_diff",
        "generate_context",
        "load_app_state",
        "save_app_state"
      ])
    );
  });
  test("handles cancelled dialogs, clipboard and save", async () => {
    const c = createNativeClient();
    open.mockResolvedValue(null);
    expect(await c.chooseProject()).toBeNull();
    await c.copyOutput("x");
    expect(writeText).toHaveBeenCalledWith("x");
    save.mockResolvedValue(null);
    expect(await c.saveOutput("x", "markdown", "demo")).toBeNull();
    save.mockResolvedValue("/tmp/demo.md");
    invoke.mockResolvedValue("/tmp/demo.md");
    expect(await c.saveOutput("x", "markdown", "demo")).toBe("/tmp/demo.md");
    expect(invoke).toHaveBeenCalledWith("write_output", { path: "/tmp/demo.md", contents: "x" });
  });
  test("wraps output, watcher and event listeners", async () => {
    const c = createNativeClient();
    invoke.mockResolvedValue(undefined);
    await c.openOutput("/tmp/a.md");
    await c.revealOutput("/tmp/a.md");
    await c.startWatch("/repo");
    await c.stopWatch();
    const off = vi.fn();
    listen.mockResolvedValue(off);
    const changed = vi.fn();
    expect(await c.onProjectChanged(changed)).toBe(off);
    listen.mock.calls[0][1]({});
    expect(changed).toHaveBeenCalled();
    const dropOff = vi.fn();
    onDragDropEvent.mockImplementation(async (cb) => {
      cb({ payload: { type: "drop", paths: ["/drop"] } });
      return dropOff;
    });
    const dropped = vi.fn();
    expect(await c.onProjectDrop(dropped)).toBe(dropOff);
    expect(dropped).toHaveBeenCalledWith("/drop");
  });
});
