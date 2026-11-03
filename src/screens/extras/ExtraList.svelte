<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { extrasState } from '../../state/extras.svelte';
  import { EXTRAS_CATALOG } from '../../domain/extras-catalog';
  import { extraTotal, iconFor, sumExtras } from '../../domain/extras';
  import { fmtNumber } from '../../domain/nutrition';
  import type { ExtraLog } from '../../domain/types';
  import FoodIcon from '../../ui/FoodIcon.svelte';
  import ExtraItemSheet from './ExtraItemSheet.svelte';

  // Gli sgarri del giorno. Le voci dei pasti liberi stanno nella scheda del
  // pasto; quelle di un pasto che non è più libero tornano qui, come sgarri.
  let { date }: { date: string } = $props();

  const frees = $derived(app.frees(date));
  const items = $derived(extrasState.forDate(date).filter((e) => e.freeSlot === null || !frees.has(e.freeSlot)));
  const total = $derived(sumExtras(items).kcal);
  const ORIGIN: Record<ExtraLog['origin'], string> = { catalogo: 'stima', mia: 'tua', alimento: 'alimento', manuale: 'scritta a mano' };

  let openId = $state<string | null>(null);
  let sheetOpen = $state(false);
</script>

{#if items.length}
  <h2 class="section-title head">Fuori piano <small class="num">{fmtNumber(total)} kcal</small></h2>
  {#each items as e (e.id)}
    <button class="row-x" onclick={() => { openId = e.id; sheetOpen = true; }}>
      <span class="ic"><FoodIcon name={iconFor(e, EXTRAS_CATALOG)} size={36} /></span>
      <span class="g">
        <span class="t">{e.name}{#if e.qty > 1}<span class="qty">×{e.qty}</span>{/if}</span>
        <span class="s">{[e.portion, ORIGIN[e.origin]].filter(Boolean).join(' · ')}</span>
      </span>
      <span class="k num">{fmtNumber(extraTotal(e).kcal)}</span>
    </button>
  {/each}
{/if}

<ExtraItemSheet bind:open={sheetOpen} extraId={openId} />

<style>
  .head { display: flex; justify-content: space-between; align-items: baseline; }
  .head small { font-size: 14px; font-weight: 650; color: var(--on-hour-2); }
  .row-x { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 10px 14px; margin-bottom: 8px; border: 0; border-radius: var(--radius-row); background: var(--veil); color: var(--on-hour); text-align: left; font-size: 15px; }
  .ic { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--veil-2); }
  .g { flex: 1; min-width: 0; }
  .t { display: block; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .s { display: block; font-size: 13px; font-weight: 600; color: var(--on-hour-2); }
  .qty { margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: var(--on-hour); color: var(--hour); font-size: 13px; font-weight: 800; }
  .k { font-weight: 750; }
</style>
