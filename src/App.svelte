<script lang="ts">
  import { onMount } from "svelte";
  import Nav from "./lib/components/Nav.svelte";
  import ProjectView from "./lib/components/ProjectView.svelte";
  import ContextView from "./lib/components/ContextView.svelte";
  import RulesView from "./lib/components/RulesView.svelte";
  import OutputView from "./lib/components/OutputView.svelte";
  import StatusBar from "./lib/components/StatusBar.svelte";
  import { createNativeClient } from "./lib/native";
  import {
    DEFAULT_MAX_FILE_SIZE_BYTES,
    DEFAULT_TOKEN_BUDGET,
    WORKFLOW_PRESETS,
    addRecentProject,
    defaultPersistedState,
    normalizeError,
    shortcutAction,
    toggleIncluded,
    togglePin,
    upsertProfile
  } from "./lib/model";
  import type {
    EntryFilter,
    FileEntry,
    FileOverride,
    GenerationResult,
    InspectionResult,
    NativeClient,
    OutputFormat,
    PersistedState,
    SavedProfile,
    Workspace
  } from "./lib/types";

  let { client = createNativeClient() }: { client?: NativeClient } = $props();
  let workspace = $state<Workspace>("project");
  let rootPath = $state("");
  let state = $state<PersistedState>(defaultPersistedState());
  let inspection = $state<InspectionResult | null>(null);
  let generation = $state<GenerationResult | null>(null);
  let includePatterns = $state<string[]>([]);
  let excludePatterns = $state<string[]>(["**/dist/**", "**/coverage/**"]);
  let maxFileSizeBytes = $state(DEFAULT_MAX_FILE_SIZE_BYTES);
  let tokenBudget = $state<number | null>(DEFAULT_TOKEN_BUDGET);
  let format = $state<OutputFormat>("markdown");
  let overrides = $state<FileOverride[]>([]);
  let selectedPath = $state("");
  let preview = $state("");
  let diff = $state("");
  let query = $state("");
  let filter = $state<EntryFilter>("all");
  let busy = $state(false);
  let error = $state("");
  let initialized = $state(false);
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let unlistenChanged: (() => void) | undefined;
  let unlistenDrop: (() => void) | undefined;

  const inspectRequest = $derived({
    rootPath,
    includePatterns,
    excludePatterns,
    maxFileSizeBytes,
    tokenBudget,
    overrides
  });
  const projectName = $derived(rootPath.split(/[\\/]/).pop() || "No project");

  onMount(() => {
    let active = true;
    void (async () => {
      try {
        state = await client.loadState();
      } catch {
        state = defaultPersistedState();
      }
      initialized = true;
      unlistenChanged = await client.onProjectChanged(() => {
        if (state.settings.liveRefresh) scheduleRefresh();
      });
      unlistenDrop = await client.onProjectDrop((path) => void openProject(path));
      if (!active) {
        unlistenChanged?.();
        unlistenDrop?.();
      }
    })();
    return () => {
      active = false;
      clearTimeout(refreshTimer);
      unlistenChanged?.();
      unlistenDrop?.();
      void client.stopWatch();
    };
  });

  $effect(() => {
    inspectRequest;
    if (initialized && rootPath) scheduleRefresh();
  });

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refresh(), 220);
  }
  async function persist(next = state) {
    state = next;
    try {
      await client.saveState(next);
    } catch (e) {
      error = normalizeError(e);
    }
  }
  async function chooseProject() {
    const path = await client.chooseProject();
    if (path) await openProject(path);
  }
  async function openProject(path: string) {
    rootPath = path;
    generation = null;
    selectedPath = "";
    preview = "";
    diff = "";
    error = "";
    workspace = "context";
    await persist({ ...state, recentProjects: addRecentProject(state.recentProjects, path) });
    await updateWatch();
    await refresh();
  }
  async function refresh() {
    if (!rootPath) return;
    busy = true;
    error = "";
    try {
      inspection = await client.inspect(inspectRequest);
    } catch (e) {
      inspection = null;
      error = normalizeError(e);
    } finally {
      busy = false;
    }
  }
  async function selectEntry(entry: FileEntry) {
    selectedPath = entry.path;
    preview = "";
    diff = "";
    error = "";
    try {
      [preview, diff] = await Promise.all([
        client.preview(rootPath, entry.path),
        entry.gitStatus ? client.diff(rootPath, entry.path) : Promise.resolve("")
      ]);
    } catch (e) {
      error = normalizeError(e);
    }
  }
  function changeIncluded(entry: FileEntry) {
    overrides = toggleIncluded(overrides, entry);
  }
  function changePin(entry: FileEntry) {
    overrides = togglePin(overrides, entry);
  }
  async function generateContext() {
    if (!rootPath) {
      workspace = "project";
      return;
    }
    busy = true;
    error = "";
    try {
      generation = await client.generate({ ...inspectRequest, format });
      workspace = "output";
    } catch (e) {
      error = normalizeError(e);
      workspace = "output";
    } finally {
      busy = false;
    }
  }
  async function copyOutput() {
    if (!generation) return;
    try {
      await client.copyOutput(generation.output);
    } catch (e) {
      error = normalizeError(e);
    }
  }
  async function saveOutput() {
    if (!generation) return;
    try {
      const path = await client.saveOutput(generation.output, format, `${projectName}-context`);
      if (path) await persist({ ...state, lastExportPath: path });
    } catch (e) {
      error = normalizeError(e);
    }
  }
  async function openSaved() {
    if (state.lastExportPath)
      try {
        await client.openOutput(state.lastExportPath);
      } catch (e) {
        error = normalizeError(e);
      }
  }
  async function revealSaved() {
    if (state.lastExportPath)
      try {
        await client.revealOutput(state.lastExportPath);
      } catch (e) {
        error = normalizeError(e);
      }
  }
  function changeRules(value: {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFileSizeBytes?: number;
    tokenBudget?: number | null;
    format?: OutputFormat;
  }) {
    if (value.includePatterns) includePatterns = value.includePatterns;
    if (value.excludePatterns) excludePatterns = value.excludePatterns;
    if (value.maxFileSizeBytes !== undefined) maxFileSizeBytes = value.maxFileSizeBytes;
    if (value.tokenBudget !== undefined) tokenBudget = value.tokenBudget;
    if (value.format) format = value.format;
  }
  function applyPreset(id: string) {
    const preset = WORKFLOW_PRESETS.find((v) => v.id === id) ?? WORKFLOW_PRESETS[0];
    includePatterns = [...preset.include];
    excludePatterns = [...preset.exclude];
    tokenBudget = preset.tokenBudget;
    void persist({ ...state, settings: { ...state.settings, selectedPreset: preset.id } });
  }
  function saveProfile(name: string) {
    const profile: SavedProfile = {
      id: crypto.randomUUID(),
      name,
      includePatterns,
      excludePatterns,
      maxFileSizeBytes,
      tokenBudget,
      format
    };
    void persist({ ...state, profiles: upsertProfile(state.profiles, profile) });
  }
  function applyProfile(profile: SavedProfile) {
    includePatterns = [...profile.includePatterns];
    excludePatterns = [...profile.excludePatterns];
    maxFileSizeBytes = profile.maxFileSizeBytes;
    tokenBudget = profile.tokenBudget;
    format = profile.format === "text" ? "text" : "markdown";
  }
  async function updateWatch() {
    try {
      await client.stopWatch();
      if (rootPath && state.settings.liveRefresh) await client.startWatch(rootPath);
    } catch (e) {
      error = normalizeError(e);
    }
  }
  function onKeydown(event: KeyboardEvent) {
    const action = shortcutAction(event);
    if (!action) return;
    event.preventDefault();
    if (action === "generate") void generateContext();
    else if (action === "choose") void chooseProject();
    else if (action === "rules") workspace = "rules";
    else {
      workspace = "context";
      queueMicrotask(() =>
        document.querySelector<HTMLInputElement>('input[aria-label="Search files"]')?.focus()
      );
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />
<div class="app-shell" data-appearance={state.settings.appearance}>
  <header class="topbar">
    <button class="brand" onclick={() => (workspace = "project")} aria-label="Git-Ingest home"
      ><img src="/assets/icon.png" alt="" /><span>Git-Ingest</span></button
    >
    <div class="project-chip">
      <span class="status-dot"></span><strong>{projectName}</strong
      >{#if inspection?.git.branch}<span>{inspection.git.branch}</span>{/if}
    </div>
    <div class="top-actions">
      <button onclick={() => (workspace = "rules")}>Rules</button><button
        class="primary"
        disabled={busy}
        onclick={() => void generateContext()}>Generate</button
      >
    </div>
  </header>
  <div class="main-grid">
    <Nav active={workspace} onselect={(value) => (workspace = value)} />
    <main>
      {#if workspace === "project"}<ProjectView
          {rootPath}
          recentProjects={state.recentProjects}
          onchoose={() => void chooseProject()}
          onopen={(path) => void openProject(path)}
        />{:else if workspace === "context"}<ContextView
          {inspection}
          {selectedPath}
          {preview}
          {diff}
          {error}
          {query}
          {filter}
          onquery={(value) => (query = value)}
          onfilter={(value) => (filter = value)}
          onselect={(entry) => void selectEntry(entry)}
          ontoggle={changeIncluded}
          ontogglepin={changePin}
        />{:else if workspace === "rules"}<RulesView
          {includePatterns}
          {excludePatterns}
          {maxFileSizeBytes}
          {tokenBudget}
          {format}
          selectedPreset={state.settings.selectedPreset}
          profiles={state.profiles}
          onchange={changeRules}
          onpreset={applyPreset}
          onsaveprofile={saveProfile}
          onapplyprofile={applyProfile}
        />{:else}<OutputView
          {generation}
          lastExportPath={state.lastExportPath}
          {busy}
          {error}
          ongenerate={() => void generateContext()}
          oncopy={() => void copyOutput()}
          onsave={() => void saveOutput()}
          onopen={() => void openSaved()}
          onreveal={() => void revealSaved()}
        />{/if}
    </main>
  </div>
  <StatusBar {inspection} liveRefresh={state.settings.liveRefresh} />
</div>
