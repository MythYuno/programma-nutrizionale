<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let { open = $bindable(false), title, children }: { open: boolean; title: string; children: Snippet } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={open ? onKey : undefined} />

{#if open}
  <button class="scrim" aria-label="Chiudi" transition:fade={{ duration: 180 }} onclick={() => (open = false)}></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={title} transition:fly={{ y: 500, duration: 280, opacity: 1 }}>
    <div class="grab"></div>
    <header>
      <h2>{title}</h2>
      <button class="link" onclick={() => (open = false)}>Fine</button>
    </header>
    <div class="body">{@render children()}</div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 40; background: rgba(0, 0, 0, 0.35); border: 0; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; max-width: 560px; margin: 0 auto;
    max-height: 88vh; display: flex; flex-direction: column;
    background: var(--bg); border-radius: 14px 14px 0 0; box-shadow: var(--shadow);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .grab { width: 36px; height: 5px; border-radius: 3px; background: var(--text-3); margin: 6px auto 0; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; }
  h2 { font-size: 17px; font-weight: 600; margin: 0; }
  .body { overflow-y: auto; padding: 4px 16px 20px; }
</style>
