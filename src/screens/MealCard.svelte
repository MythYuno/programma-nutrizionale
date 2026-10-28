<script lang="ts">
  import Check from 'phosphor-svelte/lib/Check';
  import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
  import Circle from 'phosphor-svelte/lib/Circle';
  import ArrowsLeftRight from 'phosphor-svelte/lib/ArrowsLeftRight';
  import CaretDown from 'phosphor-svelte/lib/CaretDown';
  import { slide } from 'svelte/transition';
  import type { Meal, PlanItem } from '../domain/types';
  import { SLOT_LABEL } from '../domain/types';
  import { fmtGrams, fmtNumber, mealMacro } from '../domain/nutrition';
  import { alternativesFor } from '../domain/substitutions';
  import { app } from '../state/app.svelte';
  import { SLOT_COLOR } from '../ui/format';

  let { meal, done, hero = false, onToggle, onSubs }: {
    meal: Meal;
    done: boolean;
    hero?: boolean;
    onToggle: () => void;
    onSubs: (item: PlanItem) => void;
  } = $props();

  let open = $state(false);
  let showNote = $state(false);
  const expanded = $derived(hero || open);
  const kcal = $derived(mealMacro(meal, app.foodIndex).kcal);

  function name(id: string) {
    return app.foodIndex.get(id)?.name ?? 'Alimento sconosciuto';
  }
  function hasSubs(it: PlanItem) {
    return it.subs.length > 0 || alternativesFor(name(it.foodId), it.grams).length > 0;
  }
</script>

<article class="card" class:hero class:done style="--accent: {SLOT_COLOR[meal.slot]}">
  {#if hero}
    <div class="kicker">Adesso · {SLOT_LABEL[meal.slot]}</div>
    <h2>{meal.title}</h2>
  {:else}
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="dot" aria-hidden="true">
        {#if done}<CheckCircle size={22} weight="fill" color="var(--green)" />{:else}<Circle size={22} color="var(--text-3)" />{/if}
      </span>
      <span class="grow">
        <span class="slot">{SLOT_LABEL[meal.slot]}</span>
        <span class="title">{meal.title}</span>
      </span>
      <span class="kcal num">{fmtNumber(kcal)} kcal</span>
      <span class="caret" class:up={open}><CaretDown size={16} /></span>
    </button>
  {/if}

  {#if expanded}
    <div transition:slide={{ duration: hero ? 0 : 200 }}>
      <ul class="items">
        {#each meal.items as it, i (i)}
          <li>
            {#if hasSubs(it)}
              <button class="item sub" onclick={() => onSubs(it)}>
                <span class="grow">{name(it.foodId)}</span>
                <ArrowsLeftRight size={15} />
                <b class="num">{fmtGrams(it.grams)}</b>
              </button>
            {:else}
              <div class="item"><span class="grow">{name(it.foodId)}</span><b class="num">{fmtGrams(it.grams)}</b></div>
            {/if}
          </li>
        {/each}
      </ul>

      {#if meal.note}
        <button class="note-toggle" onclick={() => (showNote = !showNote)} aria-expanded={showNote}>
          {showNote ? 'Nascondi note' : 'Note e preparazione'}
        </button>
        {#if showNote}<p class="note" transition:slide={{ duration: 180 }}>{meal.note}</p>{/if}
      {/if}

      <button class="btn" class:green={!done} class:tinted={done} onclick={onToggle}>
        {#if done}Annulla "fatto"{:else}<Check size={20} weight="bold" /> Fatto{/if}
      </button>
      {#if hero}<p class="muted small center num">{fmtNumber(kcal)} kcal</p>{/if}
    </div>
  {/if}
</article>

<style>
  .card { padding: 0; overflow: hidden; }
  .hero { padding: 16px; }
  .kicker { color: var(--accent); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
  h2 { font-size: 22px; margin: 4px 0 8px; font-weight: 700; }
  .head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; background: none; border: 0; text-align: left; }
  .dot { display: flex; }
  .grow { flex: 1; min-width: 0; }
  .slot { display: block; font-size: 12px; font-weight: 600; color: var(--accent); text-transform: uppercase; }
  .title { display: block; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .done .title { color: var(--text-2); }
  .kcal { font-size: 15px; color: var(--text-2); }
  .caret { color: var(--text-3); display: flex; transition: transform 0.2s; }
  .caret.up { transform: rotate(180deg); }
  .card:not(.hero) > div { padding: 0 16px 14px; }
  .items { list-style: none; margin: 0 0 8px; padding: 0; }
  .item { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; padding: 8px 0; border: 0; background: none; text-align: left; border-top: 0.5px solid var(--sep); font-size: 17px; }
  li:first-child .item { border-top: 0; }
  .item.sub { color: var(--blue); }
  .item.sub b { color: var(--text); }
  .note-toggle { background: none; border: 0; color: var(--blue); padding: 6px 0 10px; font-size: 15px; }
  .note { white-space: pre-line; font-size: 15px; color: var(--text-2); margin: 0 0 12px; line-height: 1.4; }
  .center { text-align: center; margin: 8px 0 0; }
</style>
