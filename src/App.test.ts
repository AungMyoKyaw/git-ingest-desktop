import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import App from "./App.svelte";
import type { GenerationResult, InspectionResult, NativeClient, PersistedState } from "./lib/types";
const state: PersistedState = {
  recentProjects: [],
  profiles: [],
  settings: { appearance: "system", liveRefresh: false, selectedPreset: "general" },
  lastExportPath: null
};
const inspection: InspectionResult = {
  rootPath: "/repo",
  projectName: "repo",
  git: { available: true, branch: "main" },
  entries: [
    {
      path: "src/main.ts",
      sizeBytes: 120,
      language: "TypeScript",
      estimatedTokens: 30,
      included: true,
      pinned: false,
      skipReason: null,
      gitStatus: "M",
      dependencies: ["./x"],
      relevanceScore: 100,
      relevanceReasons: ["changed in Git"]
    },
    {
      path: "README.md",
      sizeBytes: 50,
      language: "Markdown",
      estimatedTokens: 12,
      included: false,
      pinned: false,
      skipReason: "matched exclude rules",
      gitStatus: null,
      dependencies: [],
      relevanceScore: 20,
      relevanceReasons: ["documentation"]
    }
  ],
  ignoredDirectories: [],
  includedFiles: 1,
  skippedFiles: 1,
  totalBytes: 120,
  estimatedTokens: 30,
  budgetTokens: 60000
};
const generation: GenerationResult = {
  output: "# Repository Context\n\n## src/main.ts",
  format: "markdown",
  includedFiles: 1,
  skippedFiles: 1,
  totalBytes: 120,
  approximateTokens: 40
};
function client(overrides: Partial<NativeClient> = {}): NativeClient {
  return {
    chooseProject: vi.fn().mockResolvedValue("/repo"),
    inspect: vi.fn().mockResolvedValue(inspection),
    preview: vi.fn().mockResolvedValue("export const x = 1;"),
    diff: vi.fn().mockResolvedValue("+changed"),
    generate: vi.fn().mockResolvedValue(generation),
    loadState: vi.fn().mockResolvedValue(state),
    saveState: vi.fn().mockResolvedValue(undefined),
    copyOutput: vi.fn().mockResolvedValue(undefined),
    saveOutput: vi.fn().mockResolvedValue("/tmp/repo-context.md"),
    openOutput: vi.fn().mockResolvedValue(undefined),
    revealOutput: vi.fn().mockResolvedValue(undefined),
    startWatch: vi.fn().mockResolvedValue(undefined),
    stopWatch: vi.fn().mockResolvedValue(undefined),
    onProjectChanged: vi.fn().mockResolvedValue(() => {}),
    onProjectDrop: vi.fn().mockResolvedValue(() => {}),
    ...overrides
  };
}
afterEach(() => cleanup());
describe("Git-Ingest app", () => {
  test("opens a project, explores files, changes rules and generates output", async () => {
    const c = client();
    render(App, { client: c });
    await fireEvent.click(screen.getByRole("button", { name: "Choose folder" }));
    await screen.findByText("src/main.ts");
    expect(c.inspect).toHaveBeenCalled();
    await fireEvent.click(screen.getByText("src/main.ts"));
    await screen.findByText("export const x = 1;");
    expect(screen.getByText("+changed")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Pin src/main.ts" }));
    await waitFor(() => expect(c.inspect).toHaveBeenCalledTimes(2));
    await fireEvent.click(screen.getByRole("button", { name: "Rules" }));
    expect(screen.getByText("Shape the context deliberately.")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Codex/ }));
    await fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await screen.findByText("Generate once. Hand off clean context.");
    expect(screen.getByText(/Repository Context/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await fireEvent.click(screen.getByRole("button", { name: "Save as…" }));
    await waitFor(() => expect(c.copyOutput).toHaveBeenCalled());
    await waitFor(() => expect(c.saveOutput).toHaveBeenCalled());
  });
  test("shows inspect and preview errors", async () => {
    const c = client({ inspect: vi.fn().mockRejectedValue(new Error("scan failed")) });
    render(App, { client: c });
    await fireEvent.click(screen.getByRole("button", { name: "Choose folder" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("scan failed");
    cleanup();
    const c2 = client({ preview: vi.fn().mockRejectedValue("preview failed") });
    render(App, { client: c2 });
    await fireEvent.click(screen.getByRole("button", { name: "Choose folder" }));
    await fireEvent.click(await screen.findByText("src/main.ts"));
    expect(await screen.findByRole("alert")).toHaveTextContent("preview failed");
  });
  test("uses recent projects, filters context and shortcuts", async () => {
    const c = client({
      loadState: vi.fn().mockResolvedValue({ ...state, recentProjects: ["/recent/repo"] })
    });
    render(App, { client: c });
    const recent = await screen.findByRole("button", { name: /repo \/recent\/repo/ });
    await fireEvent.click(recent);
    await screen.findByText("src/main.ts");
    const search = screen.getByRole("textbox", { name: "Search files" });
    await fireEvent.input(search, { target: { value: "README" } });
    const list = screen.getByLabelText("Repository files");
    expect(within(list).getByText("README.md")).toBeInTheDocument();
    await fireEvent.keyDown(window, { key: ",", metaKey: true });
    expect(await screen.findByText("Shape the context deliberately.")).toBeInTheDocument();
    await fireEvent.keyDown(window, { key: "f", metaKey: true });
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Search files" })).toHaveFocus()
    );
  });
  test("handles generation errors without losing output workspace", async () => {
    const c = client({ generate: vi.fn().mockRejectedValue(new Error("generation failed")) });
    render(App, { client: c });
    await fireEvent.click(screen.getByRole("button", { name: "Choose folder" }));
    await screen.findByText("src/main.ts");
    await fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("generation failed");
  });
});
