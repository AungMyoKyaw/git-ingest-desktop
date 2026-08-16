import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App.svelte";
import type { InspectionResult, NativeClient, PersistedState } from "./lib/types";

const persisted: PersistedState = {
  recentProjects: [],
  profiles: [],
  settings: { appearance: "system", liveRefresh: false, selectedPreset: "general" },
  lastExportPath: null
};
const inspection: InspectionResult = {
  rootPath: "/repo",
  projectName: "repo",
  git: { available: false, branch: null },
  entries: [],
  ignoredDirectories: [],
  includedFiles: 0,
  skippedFiles: 0,
  totalBytes: 0,
  estimatedTokens: 0,
  budgetTokens: 60000
};
function client(): NativeClient {
  return {
    chooseProject: vi.fn().mockResolvedValue("/repo"),
    inspect: vi.fn().mockResolvedValue(inspection),
    preview: vi.fn(),
    diff: vi.fn(),
    generate: vi.fn(),
    loadState: vi.fn().mockResolvedValue(persisted),
    saveState: vi.fn().mockResolvedValue(undefined),
    copyOutput: vi.fn(),
    saveOutput: vi.fn(),
    openOutput: vi.fn(),
    revealOutput: vi.fn(),
    startWatch: vi.fn().mockResolvedValue(undefined),
    stopWatch: vi.fn().mockResolvedValue(undefined),
    onProjectChanged: vi.fn().mockResolvedValue(() => {}),
    onProjectDrop: vi.fn().mockResolvedValue(() => {})
  };
}
afterEach(cleanup);

test("enables and disables live project refresh from Rules", async () => {
  const c = client();
  render(App, { client: c });
  await fireEvent.click(screen.getByRole("button", { name: "Choose folder" }));
  await waitFor(() => expect(c.inspect).toHaveBeenCalled());
  await fireEvent.click(screen.getByRole("button", { name: "Rules" }));
  const toggle = screen.getByRole("checkbox", { name: "Live refresh" });
  await fireEvent.click(toggle);
  await waitFor(() => expect(c.startWatch).toHaveBeenCalledWith("/repo"));
  expect(c.saveState).toHaveBeenLastCalledWith(
    expect.objectContaining({ settings: expect.objectContaining({ liveRefresh: true }) })
  );
  await fireEvent.click(toggle);
  await waitFor(() => expect(c.stopWatch).toHaveBeenCalled());
});
