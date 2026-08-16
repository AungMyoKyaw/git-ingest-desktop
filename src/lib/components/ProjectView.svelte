<script lang="ts">
  let {
    rootPath,
    recentProjects,
    onchoose,
    onopen
  }: {
    rootPath: string;
    recentProjects: string[];
    onchoose: () => void;
    onopen: (path: string) => void;
  } = $props();

  function projectLabel(path: string): string {
    return path.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? path;
  }
</script>

<section class="view">
  <div class="view-heading">
    <div>
      <p class="eyebrow">Project</p>
      <h1>Choose what the model can see.</h1>
      <p>Everything stays local. Git-Ingest reads only the repository you select.</p>
    </div>
    <button class="primary" onclick={onchoose}>Choose folder</button>
  </div>

  {#if rootPath}
    <div class="hero-card">
      <span class="status-dot"></span>
      <div>
        <strong>Current project</strong>
        <p>{rootPath}</p>
      </div>
    </div>
  {:else}
    <div class="empty">
      <h2>No project open</h2>
      <p>Choose or drop a repository folder to inspect it.</p>
    </div>
  {/if}

  <div class="section-heading">
    <h2>Recent projects</h2>
    <span>{recentProjects.length}</span>
  </div>

  {#if recentProjects.length}
    <div class="recent-list">
      {#each recentProjects as path}
        <button onclick={() => onopen(path)}>
          <strong>{projectLabel(path)}</strong>
          <span>{path}</span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="muted">Projects you open will appear here.</p>
  {/if}
</section>
