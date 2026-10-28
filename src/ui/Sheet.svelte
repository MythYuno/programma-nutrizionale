<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let { open = $bindable(false), title, children }: { open: boolean; title: string; children: Snippet } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={open ? onKey : undefined} />

{#if open}
  <button class="scrim" aria-label="Chiudi" transition:fade={{ duration: 200 }} onclick={() => (open = false)}></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={title} transition:fly={{ y: 500, duration: 320, opacity: 1, easing: cubicOut }}>
    <div class="grab"></div>
    <header>
      <h2>{title}</h2>
      <button class="link" onclick={() => (open = false)}>Fine</button>
    </header>
    <div class="body sheet-body">{@render children()}</div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 40; background: color-mix(in srgb, var(--hour-deep) 45%, rgba(0, 0, 0, 0.35)); border: 0; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; max-width: 560px; margin: 0 auto;
    max-height: 88vh; display: flex; flex-direction: column;
    background: var(--card-2); color: var(--ink); border-radius: 28px 28px 0 0;
    box-shadow: 0 -18px 40px -12px rgba(0, 0, 0, 0.35);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .grab { width: 38px; height: 5px; border-radius: 3px; background: var(--ink-3); opacity: 0.6; margin: 8px auto 0; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 18px 6px; }
  h2 { font-size: 19px; font-weight: 750; letter-spacing: -0.01em; margin: 0; }
  .body { overflow-y: auto; overscroll-behavior: contain; padding: 4px 16px 22px; }
  /* Nel foglio le righe stanno su un piano già sollevato: niente ombra, solo bordo. */
  .body :global(.group) { box-shadow: 0 0 0 1px var(--sep); }
</style>
