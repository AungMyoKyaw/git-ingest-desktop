<script lang="ts">
  import type { GenerationResult } from "../types";
  import { formatBytes, formatTokenCount } from "../model";
  let {
    generation,
    lastExportPath,
    busy,
    error,
    ongenerate,
    oncopy,
    onsave,
    onopen,
    onreveal
  }: {
    generation: GenerationResult | null;
    lastExportPath: string | null;
    busy: boolean;
    error: string;
    ongenerate: () => void;
    oncopy: () => void;
    onsave: () => void;
    onopen: () => void;
    onreveal: () => void;
  } = $props();
</script>

<section class="view output-view">
  <div class="view-heading">
    <div>
      <p class="eyebrow">Output</p>
      <h1>Generate once. Hand off clean context.</h1>
    </div>
    <button class="primary" disabled={busy} onclick={ongenerate}
      >{busy ? "Generating…" : "Generate context"}</button
    >
  </div>
  {#if error}<div class="alert" role="alert">{error}</div>{/if}{#if generation}<div
      class="output-metrics"
    >
      <div><strong>{generation.includedFiles}</strong><span>included files</span></div>
      <div>
        <strong>{formatTokenCount(generation.approximateTokens)}</strong><span>output tokens</span>
      </div>
      <div><strong>{formatBytes(generation.totalBytes)}</strong><span>source bytes</span></div>
    </div>
    <div class="output-actions">
      <button onclick={oncopy}>Copy</button><button onclick={onsave}>Save as…</button
      >{#if lastExportPath}<button onclick={onopen}>Open</button><button onclick={onreveal}
          >Reveal</button
        >{/if}
    </div>
    <pre class="generated-output">{generation.output}</pre>{:else}<div class="empty">
      <h2>Nothing generated yet</h2>
      <p>Review Context and Rules, then generate Markdown or plain text.</p>
    </div>{/if}
</section>
