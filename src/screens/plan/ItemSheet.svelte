<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';
  import X from 'phosphor-svelte/lib/X';
  import type { Meal, Portion } from '../../domain/types';
  import { fmtNumber, portionMacro, rounded } from '../../domain/nutrition';
  import { app } from '../../state/app.svelte';
  import { editor } from '../../state/editor.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import FoodPicker from './FoodPicker.svelte';

  let { meal, index = $bindable(null) }: { meal: Meal; index: number | null } = $props();

  let open = $state(false);
  let foodId = $state('');
  let grams = $state('');
  let subs = $state<{ foodId: string; grams: string }[]>([]);
  let picking = $state<'main' | 'sub' | number | null>(null);
  let error = $state('');

  $effect(() => {
    if (index === null) return;
    const it = index >= 0 ? meal.items[index] : undefined;
    foodId = it?.foodId ?? '';
    grams = it ? String(it.grams) : '';
    subs = (it?.subs ?? []).map((s) => ({ foodId: s.foodId, grams: String(s.grams) }));
    picking = it ? null : 'main';
    error = '';
    open = true;
  });
  $effect(() => {
    if (!open) index = null;
  });

  const num = (s: string) => Number(s.replace(',', '.'));
  const name = (id: string) => app.foodIndex.get(id)?.name ?? '';
  const macro = $derived(foodId && num(grams) > 0 ? rounded(portionMacro({ foodId, grams: num(grams) }, app.foodIndex)) : null);

  function picked(id: string) {
    if (picking === 'main') foodId = id;
    else if (picking === 'sub') subs = [...subs, { foodId: id, grams: '' }];
    else if (typeof picking === 'number') subs[picking]!.foodId = id;
    picking = null;
  }

  function save() {
    const g = num(grams);
    if (!foodId) { error = 'Scegli un alimento.'; return; }
    if (!(g > 0)) { error = 'Inserisci i grammi.'; return; }
    const cleanSubs: Portion[] = [];
    for (const s of subs) {
      const sg = num(s.grams);
      if (!(sg > 0)) { error = `Inserisci i grammi per lo scambio "${name(s.foodId)}".`; return; }
      cleanSubs.push({ foodId: s.foodId, grams: sg });
    }
    editor.setItem(meal.slot, index ?? -1, { foodId, grams: g, subs: cleanSubs });
    open = false;
  }

  function remove() {
    if (index !== null && index >= 0) editor.removeItem(meal.slot, index);
    open = false;
  }

  function move(d: -1 | 1) {
    if (index !== null && index >= 0) editor.moveItem(meal.slot, index, d);
    open = false;
  }
</script>

<Sheet bind:open title={picking !== null ? 'Scegli alimento' : index === -1 ? 'Nuovo alimento' : 'Alimento'}>
  {#if picking !== null}
    <FoodPicker onPick={picked} />
    {#if foodId}<button class="btn plain" onclick={() => (picking = null)}>Torna indietro</button>{/if}
  {:else}
    <div class="group">
      <button class="row" onclick={() => (picking = 'main')}>
        <span class="grow">{name(foodId) || 'Scegli alimento'}</span><span class="link">Cambia</span>
      </button>
      <label class="row">
        <span class="grow">Grammi</span>
        <input class="g num" inputmode="decimal" bind:value={grams} placeholder="0" aria-label="Grammi" />
      </label>
    </div>
    {#if macro}<p class="section-foot num">{fmtNumber(macro.kcal)} kcal · P {macro.p} g · C {macro.c} g · G {macro.f} g</p>{/if}

    <h3 class="section-title">Scambi del medico</h3>
    <div class="group">
      {#each subs as s, i (i)}
        <div class="row">
          <button class="grow pick" onclick={() => (picking = i)}>{name(s.foodId)}</button>
          <input class="g num" inputmode="decimal" bind:value={s.grams} placeholder="g" aria-label="Grammi di {name(s.foodId)}" />
          <button class="x" aria-label="Rimuovi scambio" onclick={() => (subs = subs.filter((_, k) => k !== i))}><X size={16} /></button>
        </div>
      {/each}
      <button class="row add" onclick={() => (picking = 'sub')}><Plus size={16} weight="bold" /> Aggiungi scambio</button>
    </div>
    <p class="section-foot">Copia gli scambi scritti nel piano del medico, con i loro grammi.</p>

    {#if error}<p class="err">{error}</p>{/if}
    <button class="btn" onclick={save}>{index === -1 ? 'Aggiungi' : 'Fatto'}</button>
    {#if index !== null && index >= 0}
      <div class="more">
        <button class="link" disabled={index === 0} onclick={() => move(-1)}>Sposta su</button>
        <button class="link" disabled={index === meal.items.length - 1} onclick={() => move(1)}>Sposta giù</button>
        <button class="link danger" onclick={remove}>Elimina</button>
      </div>
    {/if}
  {/if}
</Sheet>

<style>
  .g { width: 80px; border: 0; background: var(--fill); border-radius: 8px; padding: 6px 8px; text-align: right; outline: none; font-size: 17px; }
  .pick { border: 0; background: none; text-align: left; padding: 0; color: var(--act); font-size: 17px; }
  .x { border: 0; background: none; color: var(--ink-2); display: flex; padding: 4px; }
  .add { color: var(--act); gap: 8px; }
  .err { color: var(--danger); font-size: 15px; }
  .more { display: flex; justify-content: space-between; margin-top: 8px; }
  .more .link:disabled { color: var(--ink-3); }
  .danger { color: var(--danger); }
</style>
