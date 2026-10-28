<script lang="ts">
  import Check from 'phosphor-svelte/lib/Check';
  import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
  import Circle from 'phosphor-svelte/lib/Circle';
  import ArrowsLeftRight from 'phosphor-svelte/lib/ArrowsLeftRight';
  import CaretDown from 'phosphor-svelte/lib/CaretDown';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Meal, PlanItem } from '../domain/types';
  import { SLOT_LABEL } from '../domain/types';
  import { fmtNumber, mealMacro } from '../domain/nutrition';
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

<article class:hero class:compact={!hero} class:open class:done style="--accent: {SLOT_COLOR[meal.slot]}">
  {#if hero}
    <div class="hero-head">
      <h2>{SLOT_LABEL[meal.slot]}</h2>
      <span class="now">adesso</span>
    </div>
    <p class="meal-title">{meal.title}</p>
  {:else}
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="dot" aria-hidden="true">
        {#if done}<CheckCircle size={24} weight="fill" />{:else}<Circle size={24} />{/if}
      </span>
      <span class="grow">
        <span class="slot">{SLOT_LABEL[meal.slot]}</span>
        <span class="title">{meal.title}</span>
      </span>
      <span class="kcal num">{fmtNumber(kcal)} kcal</span>
      <span class="caret" class:up={open}><CaretDown size={16} weight="bold" /></span>
    </button>
  {/if}

  {#if expanded}
    <div class="body" transition:slide={{ duration: hero ? 0 : 260, easing: cubicOut }}>
      <ul class="items">
        {#each meal.items as it, i (i)}
          <li>
            {#if hasSubs(it)}
              <button class="item sub" onclick={() => onSubs(it)} aria-label="{name(it.foodId)}, {it.grams} grammi: vedi sostituzioni">
                <span class="name">{name(it.foodId)} <ArrowsLeftRight size={15} weight="bold" /></span>
                <b class="num">{fmtNumber(it.grams)}<small>g</small></b>
              </button>
            {:else}
              <div class="item"><span class="name">{name(it.foodId)}</span><b class="num">{fmtNumber(it.grams)}<small>g</small></b></div>
            {/if}
          </li>
        {/each}
      </ul>

      {#if meal.note}
        <button class="note-toggle" onclick={() => (showNote = !showNote)} aria-expanded={showNote}>
          {showNote ? 'Nascondi note' : 'Note e preparazione'}
        </button>
        {#if showNote}<p class="note" transition:slide={{ duration: 200, easing: cubicOut }}>{meal.note}</p>{/if}
      {/if}

      <button class="btn" class:tinted={done} onclick={onToggle}>
        {#if done}Annulla "fatto"{:else}<Check size={20} weight="bold" /> Fatto{/if}
      </button>
      {#if hero}<p class="foot num">{fmtNumber(kcal)} kcal stimate</p>{/if}
    </div>
  {/if}
</article>

<style>
  article { margin-bottom: 10px; }
  .hero, .compact.open {
    background: var(--card); color: var(--ink);
    border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  }
  .hero { padding: 18px 18px 14px; margin-bottom: 14px; --act: var(--accent); }
  .compact { border-radius: var(--radius-row); background: var(--veil); color: var(--on-hour); transition: background-color 0.3s var(--ease-out); }
  .compact.open { --act: var(--accent); }
  .compact.done:not(.open) { opacity: 0.66; }

  .hero-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h2 { font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0; color: var(--accent); }
  .now { font-size: 13px; font-weight: 700; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); padding: 4px 10px; border-radius: 999px; }
  .meal-title { font-size: 19px; font-weight: 650; letter-spacing: -0.01em; line-height: 1.25; margin: 4px 0 8px; }

  .head { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 10px 14px; background: none; border: 0; text-align: left; color: inherit; }
  .dot { display: flex; color: var(--on-hour); }
  .open .dot { color: var(--accent); }
  .grow { flex: 1; min-width: 0; }
  .slot { display: block; font-size: 13px; font-weight: 700; color: var(--on-hour-2); }
  .open .slot { color: var(--accent); }
  .title { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kcal { font-size: 14px; color: var(--on-hour-2); }
  .open .kcal { color: var(--ink-2); }
  .caret { color: var(--on-hour-2); display: flex; transition: transform 0.25s var(--ease-out); }
  .open .caret { color: var(--ink-3); }
  .caret.up { transform: rotate(180deg); }
  .compact .body { padding: 0 16px 16px; }

  .items { list-style: none; margin: 0 0 10px; padding: 0; }
  .item { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; width: 100%; min-height: 48px; padding: 10px 0; border: 0; background: none; text-align: left; border-top: 1px solid var(--sep); font-size: 17px; color: var(--ink); }
  li:first-child .item { border-top: 0; }
  .name { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
  .item.sub .name { color: var(--accent); font-weight: 600; }
  .item b { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
  .item b small { font-size: 15px; font-weight: 700; margin-left: 2px; color: var(--ink-2); letter-spacing: 0; }
  .compact .item b { font-size: 21px; }

  .note-toggle { background: none; border: 0; color: var(--accent); padding: 4px 0 12px; font-size: 15px; font-weight: 600; }
  .note { white-space: pre-line; font-size: 15px; color: var(--ink-2); margin: 0 0 12px; line-height: 1.45; }
  .foot { text-align: center; margin: 10px 0 0; font-size: 13px; color: var(--ink-2); }
</style>
