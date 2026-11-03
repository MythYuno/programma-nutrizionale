<script lang="ts">
  import { app } from '../../state/app.svelte';
  import { extrasState } from '../../state/extras.svelte';
  import { parseAmount, validateExtra } from '../../domain/extras';
  import { fmtNumber, portionMacro } from '../../domain/nutrition';
  import type { Food, Slot } from '../../domain/types';
  import FoodIcon from '../../ui/FoodIcon.svelte';

  // Un alimento del catalogo dell'app, a grammi: kcal mentre scrivi.
  let { food, date, freeSlot, onDone }: { food: Food; date: string; freeSlot: Slot | null; onDone: () => void } = $props();

  let gramsText = $state('');
  let error = $state('');
  const grams = $derived(parseAmount(gramsText));
  const kcal = $derived(grams && grams > 0 ? portionMacro({ foodId: food.id, grams }, app.foodIndex).kcal : 0);

  async function submit() {
    const errs = validateExtra({ name: food.name, macro: { kcal, p: 0, c: 0, f: 0 }, grams, origin: 'alimento' });
    error = errs.grams ?? errs.kcal ?? '';
    if (error) return;
    await extrasState.add({ kind: 'alimento', item: food }, date, { freeSlot, grams: grams! });
    onDone();
  }
</script>

<div class="head">
  <FoodIcon name="plate" size={40} />
  <div><b>{food.name}</b><small class="num">{fmtNumber(food.per100.kcal)} kcal ogni 100 g</small></div>
</div>

<label class="g">
  <input inputmode="decimal" bind:value={gramsText} placeholder="0" aria-label="Grammi" autocomplete="off" {@attach (el) => el.focus()} />
  <span class="u">g</span>
  <span class="k num">{fmtNumber(kcal)} kcal</span>
</label>
{#if error}<p class="err">{error}</p>{/if}

<button class="btn add" onclick={submit}>Aggiungi</button>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin: 4px 4px 14px; }
  .head b { display: block; font-size: 18px; font-weight: 750; }
  .head small { font-size: 14px; color: var(--ink-2); font-weight: 600; }
  .g { display: flex; align-items: baseline; gap: 8px; padding: 12px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 0 0 2px var(--act); }
  .g input { width: 5ch; border: 0; background: none; outline: none; font-size: 34px; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; }
  .u { font-size: 16px; font-weight: 700; color: var(--ink-2); }
  .k { margin-left: auto; font-size: 17px; font-weight: 750; }
  .add { margin-top: 16px; }
  .err { color: var(--danger); font-size: 14px; margin: 6px 4px 0; }
</style>
