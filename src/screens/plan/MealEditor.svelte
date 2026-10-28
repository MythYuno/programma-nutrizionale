<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';
  import DotsThree from 'phosphor-svelte/lib/DotsThree';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import ArrowsLeftRight from 'phosphor-svelte/lib/ArrowsLeftRight';
  import type { Meal, Slot } from '../../domain/types';
  import { SLOT_LABEL } from '../../domain/types';
  import { fmtGrams, fmtNumber, mealMacro, portionMacro } from '../../domain/nutrition';
  import { app } from '../../state/app.svelte';
  import { editor } from '../../state/editor.svelte';
  import { SLOT_COLOR } from '../../ui/format';
  import Sheet from '../../ui/Sheet.svelte';
  import ItemSheet from './ItemSheet.svelte';

  // Il pasto si legge dalla bozza dell'editor, che ne è la proprietaria.
  let { slot }: { slot: Slot } = $props();
  const meal = $derived(editor.meal(slot) as Meal);

  let menu = $state(false);
  let editing = $state<number | null>(null); // indice dell'alimento, -1 = nuovo
  const kcal = $derived(mealMacro(meal, app.foodIndex).kcal);
  const hasIssue = (i: number | null) => editor.issues.some((x) => x.day === editor.day && editor.meals[x.mealIndex ?? -1] === meal && (i === null || x.itemIndex === i));
  const name = (id: string) => app.foodIndex.get(id)?.name ?? 'Scegli alimento';
</script>

<section class="group" class:issue={hasIssue(null)} style="--accent: {SLOT_COLOR[meal.slot]}">
  <div class="head">
    <span class="slot">{SLOT_LABEL[meal.slot]}</span>
    <span class="muted num small">{fmtNumber(kcal)} kcal</span>
    <button class="icon" aria-label="Opzioni {SLOT_LABEL[meal.slot]}" onclick={() => (menu = true)}><DotsThree size={22} weight="bold" /></button>
  </div>
  <input class="title" placeholder="Nome del pasto, per esempio Pasta e ceci" bind:value={meal.title} oninput={() => editor.touch()} />

  {#each meal.items as it, i (i)}
    <button class="row" class:bad={hasIssue(i)} onclick={() => (editing = i)}>
      <span class="grow">{name(it.foodId)}{#if it.subs.length}<span class="subs"><ArrowsLeftRight size={12} /> {it.subs.length}</span>{/if}</span>
      <span class="value num">{fmtGrams(it.grams)} · {fmtNumber(portionMacro(it, app.foodIndex).kcal)} kcal</span>
      <CaretRight size={16} class="chev" />
    </button>
  {/each}
  <button class="row add" onclick={() => (editing = -1)}><Plus size={18} weight="bold" /> Aggiungi alimento</button>
</section>

<ItemSheet {meal} bind:index={editing} />

<Sheet bind:open={menu} title={SLOT_LABEL[meal.slot]}>
  <!-- Le note si modificano da qui: nella scheda del pasto restano solo gli alimenti. -->
  <label class="lab" for="note-{meal.slot}">Note e preparazione</label>
  <textarea id="note-{meal.slot}" class="note" rows="4" placeholder="Condimenti liberi, preparazione, consigli…" bind:value={meal.note} oninput={() => editor.touch()}></textarea>

  <div class="group">
    <button class="row" onclick={() => { editor.applyMealToAllDays(meal.slot); menu = false; }}>
      <span class="grow">Usa questo pasto in tutti i giorni<br /><span class="muted small">Sostituisce {SLOT_LABEL[meal.slot].toLowerCase()} negli altri 6 giorni</span></span>
    </button>
    <button class="row danger" onclick={() => { editor.removeMeal(meal.slot); menu = false; }}>Elimina pasto da questo giorno</button>
  </div>
</Sheet>

<style>
  .group { --act: var(--accent); border-radius: var(--radius-card); box-shadow: var(--shadow-card); margin-bottom: 14px; }
  .group.issue { box-shadow: var(--shadow-card), 0 0 0 2px var(--danger); }
  .head { display: flex; align-items: center; gap: 8px; padding: 14px 8px 0 16px; }
  .slot { flex: 1; color: var(--accent); font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
  .icon { border: 0; background: none; color: var(--act); width: 36px; height: 32px; display: grid; place-items: center; }
  .title { width: 100%; border: 0; background: none; outline: none; padding: 2px 16px 8px; font-size: 19px; font-weight: 650; color: var(--ink); }
  .title::placeholder { color: var(--ink-3); font-weight: 500; }
  .subs { display: inline-flex; align-items: center; gap: 2px; margin-left: 8px; font-size: 12px; color: var(--act); }
  .row.bad .grow { color: var(--danger); }
  .row.add { color: var(--act); gap: 8px; }
  .row.danger { color: var(--danger); }
  .lab { display: block; font-size: 14px; font-weight: 600; color: var(--ink-2); margin: 4px 4px 6px; }
  .note { display: block; width: 100%; margin: 0 0 16px; border: 0; border-radius: 14px; background: var(--card); box-shadow: 0 0 0 1px var(--sep); padding: 12px 14px; font-size: 16px; line-height: 1.45; resize: vertical; outline: none; color: var(--ink); }
  .note:focus { box-shadow: 0 0 0 2px var(--act); }
</style>
