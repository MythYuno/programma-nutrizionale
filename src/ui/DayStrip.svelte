<script lang="ts">
  import type { Slot } from '../domain/types';
  import { SLOT_LABEL } from '../domain/types';
  import { SLOT_COLOR } from './format';

  // La giornata in segmenti, uno per pasto. Sulle schede ogni segmento ha il
  // colore della sua fascia; sul fondo colorato (ground) usa il colore del testo.
  let { segments, size = 'md', ground = false }: {
    segments: { slot: Slot; done: boolean; current?: boolean; free?: boolean }[];
    size?: 'sm' | 'md';
    ground?: boolean;
  } = $props();

  const label = $derived(
    segments.map((s) => `${SLOT_LABEL[s.slot]} ${s.free ? 'pasto libero' : s.done ? 'fatto' : s.current ? 'adesso' : 'da fare'}`).join(', '),
  );
</script>

<div class="strip {size}" class:ground role="img" aria-label={label}>
  {#each segments as s (s.slot)}
    <i class:done={s.done} class:current={s.current} class:free={s.free} style="--c: {ground ? 'var(--on-hour)' : SLOT_COLOR[s.slot]}"></i>
  {/each}
</div>

<style>
  .strip { display: flex; gap: 4px; }
  i {
    flex: 1; height: 8px; border-radius: 4px;
    background: color-mix(in srgb, var(--c) 18%, transparent);
    transition: background-color 0.5s var(--ease-out);
  }
  .ground i { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .sm i { height: 6px; border-radius: 3px; }
  i.done, .ground i.done { background: var(--c); }
  i.current { box-shadow: inset 0 0 0 2px var(--c); }
  /* Pasto libero: rigato, come le parti fuori piano del bilancio. */
  i.free, .ground i.free { background: repeating-linear-gradient(-45deg, var(--c) 0 5px, color-mix(in srgb, var(--c) 35%, transparent) 5px 9px); }
</style>
