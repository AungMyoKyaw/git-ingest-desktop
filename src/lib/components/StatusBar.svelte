<script lang="ts">
  import type { InspectionResult } from "../types";
  import { budgetPercent, formatTokenCount } from "../model";
  let { inspection, liveRefresh }: { inspection: InspectionResult | null; liveRefresh: boolean } =
    $props();
</script>

<footer class="statusbar">
  <span><i class="status-dot"></i>Local only</span>{#if inspection}<span
      >{inspection.includedFiles} included · {inspection.skippedFiles} skipped</span
    ><span
      >{formatTokenCount(inspection.estimatedTokens)} tokens{#if inspection.budgetTokens}
        · {budgetPercent(inspection.estimatedTokens, inspection.budgetTokens)}% budget{/if}</span
    >{/if}<span>{liveRefresh ? "Watching project" : "Manual refresh"}</span>
</footer>
