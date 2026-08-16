import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type {
  GenerateRequest,
  GenerationResult,
  InspectRequest,
  InspectionResult,
  NativeClient,
  OutputFormat,
  PersistedState
} from "./types";

export function createNativeClient(): NativeClient {
  return {
    async chooseProject() {
      const value = await open({
        directory: true,
        multiple: false,
        title: "Choose project folder"
      });
      return typeof value === "string" ? value : null;
    },
    inspect: (request: InspectRequest) => invoke<InspectionResult>("inspect_project", { request }),
    preview: (rootPath: string, relativePath: string) =>
      invoke<string>("preview_file", { rootPath, relativePath }),
    diff: (rootPath: string, relativePath: string) =>
      invoke<string>("git_diff", { rootPath, relativePath }),
    generate: (request: GenerateRequest) =>
      invoke<GenerationResult>("generate_context", { request }),
    loadState: () => invoke<PersistedState>("load_app_state"),
    saveState: (value: PersistedState) => invoke<void>("save_app_state", { value }),
    copyOutput: (text: string) => writeText(text),
    async saveOutput(text: string, format: OutputFormat, suggestedName: string) {
      const ext = format === "markdown" ? "md" : "txt";
      const path = await save({
        title: "Save generated context",
        defaultPath: `${suggestedName}.${ext}`,
        filters: [{ name: format === "markdown" ? "Markdown" : "Text", extensions: [ext] }]
      });
      if (!path) return null;
      return invoke<string>("write_output", { path, contents: text });
    },
    openOutput: (path: string) => invoke<void>("open_output", { path }),
    revealOutput: (path: string) => invoke<void>("reveal_output", { path }),
    startWatch: (rootPath: string) => invoke<void>("start_watch", { rootPath }),
    stopWatch: () => invoke<void>("stop_watch"),
    async onProjectChanged(callback) {
      return listen("project-changed", () => callback());
    },
    async onProjectDrop(callback) {
      return getCurrentWebviewWindow().onDragDropEvent((event) => {
        if (event.payload.type === "drop" && event.payload.paths[0])
          callback(event.payload.paths[0]);
      });
    }
  };
}
