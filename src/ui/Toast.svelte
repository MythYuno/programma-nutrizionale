<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  // Avviso breve sopra la tab bar, con un'azione facoltativa (per esempio "Annulla").
  let { message, action, onAction }: {
    message: string | null;
    action?: string;
    onAction?: () => void;
  } = $props();
</script>

<div class="wrap" aria-live="polite">
  {#if message}
    <div class="toast" transition:fly={{ y: 24, duration: 240, easing: cubicOut }}>
      <span>{message}</span>
      {#if action && onAction}<button onclick={onAction}>{action}</button>{/if}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: fixed; left: 0; right: 0; z-index: 30; pointer-events: none;
    bottom: calc(env(safe-area-inset-bottom) + 84px);
    display: flex; justify-content: center; padding: 0 16px;
  }
  .toast {
    pointer-events: auto; max-width: 528px; width: 100%;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: var(--ink); color: var(--card); border-radius: 16px;
    padding: 10px 10px 10px 16px; font-size: 15px; font-weight: 600;
    box-shadow: 0 14px 30px -12px rgba(0, 0, 0, 0.45);
  }
  button {
    border: 0; border-radius: 10px; padding: 8px 12px; min-height: 36px;
    background: color-mix(in srgb, var(--card) 16%, transparent); color: inherit; font-weight: 700;
  }
</style>
