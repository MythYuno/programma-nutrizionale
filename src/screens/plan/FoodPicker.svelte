<script lang="ts">
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import Plus from 'phosphor-svelte/lib/Plus';
  import { app } from '../../state/app.svelte';
  import { fmtNumber } from '../../domain/nutrition';
  import FoodForm from './FoodForm.svelte';

  let { onPick }: { onPick: (id: string) => void } = $props();

  let q = $state('');
  let creating = $state(false);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = $derived(
    [...app.foods].filter((f) => norm(f.name).includes(norm(q.trim()))).sort((a, b) => a.name.localeCompare(b.name, 'it')),
  );
</script>

{#if creating}
  <FoodForm initialName={q} onSaved={(f) => { creating = false; onPick(f.id); }} onCancel={() => (creating = false)} />
{:else}
  <label class="search">
    <MagnifyingGlass size={18} />
    <input placeholder="Cerca alimento" bind:value={q} aria-label="Cerca alimento" />
  </label>
  <div class="group list">
    {#each list as f (f.id)}
      <button class="row" onclick={() => onPick(f.id)}>
        <span class="grow">{f.name}<br /><span class="muted small">{f.category}</span></span>
        <span class="value small num">{fmtNumber(f.per100.kcal)} kcal/100 g</span>
      </button>
    {:else}
      <p class="muted empty">Nessun alimento trovato.</p>
    {/each}
  </div>
  <button class="btn tinted" onclick={() => (creating = true)}><Plus size={18} weight="bold" /> Nuovo alimento{q ? ` "${q}"` : ''}</button>
{/if}

<style>
  .search { display: flex; align-items: center; gap: 8px; background: var(--card); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; color: var(--ink-2); box-shadow: 0 0 0 1px var(--sep); }
  .search input { flex: 1; border: 0; background: none; outline: none; font-size: 17px; color: var(--ink); }
  .list { max-height: 50vh; overflow-y: auto; }
  .empty { padding: 16px; text-align: center; }
</style>
