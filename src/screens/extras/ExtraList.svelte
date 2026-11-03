<script lang="ts">
  import Minus from 'phosphor-svelte/lib/Minus';
  import Plus from 'phosphor-svelte/lib/Plus';
  import { extrasState } from '../../state/extras.svelte';
  import { EXTRAS_CATALOG } from '../../domain/extras-catalog';
  import { extraTotal, iconFor, sumExtras } from '../../domain/extras';
  import { fmtNumber } from '../../domain/nutrition';
  import type { ExtraLog } from '../../domain/types';
  import FoodIcon from '../../ui/FoodIcon.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import Toast from '../../ui/Toast.svelte';

  // Gli sgarri del giorno (le voci dei pasti liberi stanno nella scheda del pasto).
  let { date }: { date: string } = $props();

  const items = $derived(extrasState.forDate(date).filter((e) => e.freeSlot === null));
  const total = $derived(sumExtras(items).kcal);
  const ORIGIN: Record<ExtraLog['origin'], string> = { catalogo: 'stima', mia: 'tua', alimento: 'alimento', manuale: 'scritta a mano' };

  let openId = $state<string | null>(null);
  let sheetOpen = $state(false);
  let removed = $state<ExtraLog | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const current = $derived(items.find((e) => e.id === openId) ?? null);

  async function remove(e: ExtraLog) {
    sheetOpen = false;
    removed = await extrasState.remove(e.id);
    clearTimeout(timer);
    timer = setTimeout(() => (removed = null), 5000);
  }

  async function undo() {
    if (removed) await extrasState.restore(removed);
    removed = null;
  }
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

<Sheet bind:open={sheetOpen} title={current?.name ?? ''}>
  {#if current}
    <div class="qty-row">
      <button class="step" aria-label="Una in meno" disabled={current.qty <= 1} onclick={() => extrasState.setQty(current.id, current.qty - 1)}><Minus size={20} weight="bold" /></button>
      <span class="q num">×{current.qty}<small>{fmtNumber(extraTotal(current).kcal)} kcal</small></span>
      <button class="step" aria-label="Una in più" onclick={() => extrasState.setQty(current.id, current.qty + 1)}><Plus size={20} weight="bold" /></button>
    </div>
    <button class="btn danger" onclick={() => remove(current)}>Elimina</button>
  {/if}
</Sheet>

<Toast message={removed ? `${removed.name} eliminato` : null} action="Annulla" onAction={undo} />

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
  .qty-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 4px 18px; }
  .step { width: 52px; height: 52px; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--fill); color: var(--act); }
  .step:disabled { opacity: 0.35; }
  .q { display: flex; flex-direction: column; align-items: center; font-size: 34px; font-weight: 800; }
  .q small { font-size: 14px; font-weight: 650; color: var(--ink-2); }
</style>
