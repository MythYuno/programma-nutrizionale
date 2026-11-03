<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';
  import { EXTRAS_CATALOG } from '../../domain/extras-catalog';
  import { extraTotal, iconFor } from '../../domain/extras';
  import { fmtNumber } from '../../domain/nutrition';
  import type { ExtraLog } from '../../domain/types';
  import FoodIcon from '../../ui/FoodIcon.svelte';

  // Contenuto di un pasto segnato come libero: quello che si è mangiato al suo posto.
  let { planTitle, items, onAdd, onUnfree }: {
    planTitle: string;
    items: ExtraLog[];
    onAdd: () => void;
    onUnfree: () => void;
  } = $props();
</script>

<p class="instead">Al posto di: {planTitle}</p>
{#if items.length}
  <ul class="items">
    {#each items as e (e.id)}
      <li>
        <span class="ic"><FoodIcon name={iconFor(e, EXTRAS_CATALOG)} size={32} /></span>
        <span class="n">{e.name}{#if e.qty > 1} ×{e.qty}{/if}</span>
        <b class="num">{fmtNumber(extraTotal(e).kcal)}<small>kcal</small></b>
      </li>
    {/each}
  </ul>
{:else}
  <p class="empty">Scrivi cosa hai mangiato, se vuoi tenerne il conto.</p>
{/if}
<button class="btn tinted" onclick={onAdd}><Plus size={18} weight="bold" /> Aggiungi a questo pasto</button>
<button class="link unfree" onclick={onUnfree}>Annulla pasto libero</button>

<style>
  .instead { margin: 0 0 6px; font-size: 14px; color: var(--ink-2); }
  .items { list-style: none; margin: 0 0 10px; padding: 0; }
  li { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--sep); }
  li:first-child { border-top: 0; }
  .ic { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--fill); }
  .n { flex: 1; min-width: 0; font-size: 16px; font-weight: 600; }
  b { font-size: 18px; font-weight: 800; }
  b small { font-size: 13px; font-weight: 650; color: var(--ink-2); margin-left: 3px; }
  .empty { margin: 4px 0 12px; font-size: 15px; color: var(--ink-2); }
  .unfree { display: block; width: 100%; text-align: center; font-size: 15px; margin-top: 4px; }
</style>
