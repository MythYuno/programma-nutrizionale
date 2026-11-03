<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';

  // Pulsante fisso a portata di pollice, sopra la tab bar.
  let { label, onclick }: { label: string; onclick: () => void } = $props();
</script>

<button class="fab" {onclick}><Plus size={22} weight="bold" />{label}</button>

<style>
  .fab {
    position: fixed; z-index: 25; right: max(16px, calc((100vw - 560px) / 2 + 16px));
    bottom: calc(env(safe-area-inset-bottom) + 96px);
    display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 20px 0 16px;
    border: 0; border-radius: 26px; background: var(--card); color: var(--act);
    font-size: 16px; font-weight: 750;
    box-shadow: 0 12px 26px -10px color-mix(in srgb, var(--hour-deep) 80%, #000), 0 2px 4px rgba(0, 0, 0, 0.12);
    transition: transform 0.16s var(--ease-out);
  }
  .fab:active { transform: scale(0.97); }
</style>
