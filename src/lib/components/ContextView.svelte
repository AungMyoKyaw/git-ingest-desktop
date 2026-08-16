<script lang="ts">
  import type { EntryFilter, FileEntry, InspectionResult } from "../types";
  import { filterEntries, formatBytes, formatTokenCount } from "../model";
  let {
    inspection,
    selectedPath,
    preview,
    diff,
    error,
    query,
    filter,
    onquery,
    onfilter,
    onselect,
    ontoggle,
    ontogglepin
  }: {
    inspection: InspectionResult | null;
    selectedPath: string;
    preview: string;
    diff: string;
    error: string;
    query: string;
    filter: EntryFilter;
    onquery: (q: string) => void;
    onfilter: (f: EntryFilter) => void;
    onselect: (e: FileEntry) => void;
    ontoggle: (e: FileEntry) => void;
    ontogglepin: (e: FileEntry) => void;
  } = $props();
  let entries = $derived(inspection ? filterEntries(inspection.entries, query, filter) : []);
  const filters: EntryFilter[] = [
    "all",
    "included",
    "changed",
    "source",
    "docs",
    "tests",
    "skipped"
  ];
</script>

<section class="view context-view">
  <div class="view-heading compact">
    <div>
      <p class="eyebrow">Context</p>
      <h1>Inspect before you export.</h1>
    </div>
    {#if inspection}<div class="metric-row">
        <span>{inspection.includedFiles} files</span><span
          >{formatTokenCount(inspection.estimatedTokens)} tokens</span
        >
      </div>{/if}
  </div>
  {#if error}<div class="alert" role="alert">{error}</div>{/if}{#if inspection}<div
      class="context-toolbar"
    >
      <input
        aria-label="Search files"
        placeholder="Search path or language"
        value={query}
        oninput={(e) => onquery(e.currentTarget.value)}
      />
      <div class="filter-row">
        {#each filters as item}<button class:active={filter === item} onclick={() => onfilter(item)}
            >{item}</button
          >{/each}
      </div>
    </div>
    <div class="context-grid">
      <div class="file-list" aria-label="Repository files">
        {#each entries as entry}<div
            class:selected={selectedPath === entry.path}
            class:skipped={!entry.included}
            class="file-row"
          >
            <button class="file-main" onclick={() => onselect(entry)}
              ><strong>{entry.path}</strong><span
                >{entry.language} · {formatBytes(entry.sizeBytes)} · {formatTokenCount(
                  entry.estimatedTokens
                )} tok</span
              >{#if entry.skipReason}<small>{entry.skipReason}</small
                >{:else if entry.relevanceReasons.length}<small
                  >{entry.relevanceReasons.join(" · ")}</small
                >{/if}</button
            ><button
              class="icon-action"
              aria-label={`${entry.included ? "Exclude" : "Include"} ${entry.path}`}
              onclick={() => ontoggle(entry)}>{entry.included ? "✓" : "+"}</button
            ><button
              class:active={entry.pinned}
              class="icon-action"
              aria-label={`${entry.pinned ? "Unpin" : "Pin"} ${entry.path}`}
              onclick={() => ontogglepin(entry)}>⌖</button
            >
          </div>{/each}{#if !entries.length}<div class="empty small">
            <p>No files match this view.</p>
          </div>{/if}
      </div>
      <div class="preview-pane">
        {#if selectedPath}<div class="preview-header">
            <div>
              <strong>{selectedPath}</strong><span
                >{inspection.entries.find((e) => e.path === selectedPath)?.gitStatus ??
                  "clean"}</span
              >
            </div>
          </div>
          {#if diff}<div class="preview-label">Git diff</div>
            <pre class="diff">{diff}</pre>{/if}
          <div class="preview-label">File preview</div>
          <pre>{preview || "Loading preview…"}</pre>{:else}<div class="empty">
            <h2>Select a file</h2>
            <p>Review content, Git changes and context priority.</p>
          </div>{/if}
      </div>
    </div>{:else}<div class="empty">
      <h2>Open a project first</h2>
      <p>The repository inspector appears here after the initial scan.</p>
    </div>{/if}
</section>
