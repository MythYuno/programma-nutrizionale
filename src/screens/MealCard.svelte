<script lang="ts">
  import Check from 'phosphor-svelte/lib/Check';
  import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
  import Circle from 'phosphor-svelte/lib/Circle';
  import ArrowsLeftRight from 'phosphor-svelte/lib/ArrowsLeftRight';
  import CaretDown from 'phosphor-svelte/lib/CaretDown';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { ExtraLog, Meal, PlanItem } from '../domain/types';
  import { SLOT_LABEL } from '../domain/types';
  import { fmtNumber, mealMacro, portionMacro } from '../domain/nutrition';
  import { choiceGrams, type EatenItem } from '../domain/eaten';
  import { alternativesFor } from '../domain/substitutions';
  import { sumExtras } from '../domain/extras';
  import { app } from '../state/app.svelte';
  import { SLOT_COLOR } from '../ui/format';
  import FreeMealBody from './extras/FreeMealBody.svelte';

  let { meal, done, hero = false, skipped = false, free = false, freeItems = [], eaten = [], onToggle, onItem, onFree, onUnfree, onAddToFree, onOpenExtra }: {
    meal: Meal;
    done: boolean;
    hero?: boolean;
    skipped?: boolean;
    onToggle: () => void;
    eaten?: EatenItem[]; // quello che si è preso davvero (scambi e grammi); vuoto = piano
    onItem: (index: number) => void;
    free?: boolean;
    freeItems?: ExtraLog[];
    onFree?: () => void;
    onUnfree?: () => void;
    onAddToFree?: () => void;
    onOpenExtra?: (id: string) => void;
  } = $props();

  let open = $state(false);
  // Un pasto libero resta aperto: si vede subito cosa si è mangiato al suo posto.
  const expanded = $derived(hero || open || free);
  const kcal = $derived(mealMacro(meal, app.foodIndex).kcal);
  const rows = $derived(meal.items.map((item, i) => ({ item, e: eaten[i] ?? null })));
  const eatenKcal = $derived(rows.reduce((s, r) => s + portionMacro(r.e ?? r.item, app.foodIndex).kcal, 0));
  const modified = $derived(eaten.some((e) => e.swapped || e.changed));
  const freeKcal = $derived(sumExtras(freeItems).kcal);
  // Al posto del nome di un piatto: gli alimenti del medico, in fila.
  const foods = $derived(rows.map((r) => name(r.e?.foodId ?? r.item.foodId)).join(', '));

  function name(id: string) {
    return app.foodIndex.get(id)?.name ?? 'Alimento sconosciuto';
  }
  function hasSubs(it: PlanItem) {
    return it.subs.length > 0 || alternativesFor(name(it.foodId), it.grams).length > 0;
  }
</script>

<article class:hero class:compact={!hero} class:open={open || free} class:done style="--accent: {SLOT_COLOR[meal.slot]}">
  {#if hero}
    <div class="hero-head">
      <h2>{SLOT_LABEL[meal.slot]}</h2>
      <span class="now">adesso</span>
    </div>
  {:else}
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="dot" aria-hidden="true">
        {#if done}<CheckCircle size={24} weight="fill" />{:else}<Circle size={24} />{/if}
      </span>
      <span class="grow">
        <span class="slot">{SLOT_LABEL[meal.slot]}{#if skipped}<span class="skip">saltato?</span>{/if}{#if free}<span class="skip">pasto libero</span>{/if}</span>
        <span class="title">{free ? freeItems.map((e) => e.name).join(', ') || 'Cosa hai mangiato?' : foods}</span>
      </span>
      <span class="kcal num">{fmtNumber(free ? freeKcal : eatenKcal)} kcal</span>
      {#if !free}<span class="caret" class:up={open}><CaretDown size={16} weight="bold" /></span>{/if}
    </button>
  {/if}

  {#if expanded}
    <div class="body" transition:slide={{ duration: hero ? 0 : 260, easing: cubicOut }}>
      {#if free}
        <FreeMealBody planTitle={foods} items={freeItems} onAdd={() => onAddToFree?.()} onUnfree={() => onUnfree?.()} onOpen={(id) => onOpenExtra?.(id)} />
      {:else}
        <ul class="items">
          {#each rows as { item: it, e }, i (i)}
            {@const f = e?.foodId ?? it.foodId}
            {@const g = e?.grams ?? it.grams}
            <li>
              <button class="item" class:sub={hasSubs(it)} onclick={() => onItem(i)} aria-label="{name(it.foodId)}, {it.grams} grammi: cosa hai preso">
                <span class="name">
                  <span class:chg={e?.swapped}>{name(f)}{#if e?.swapped}<span class="tag">scambio</span>{:else if hasSubs(it)} <ArrowsLeftRight size={15} weight="bold" />{/if}</span>
                  {#if e?.swapped}<small>al posto di {name(it.foodId)} {fmtNumber(it.grams)} g</small>
                  {:else if e?.changed}<small class="chg">{fmtNumber(choiceGrams(it, f) ?? it.grams)} g nel piano</small>{/if}
                </span>
                <b class="num" class:chg={e?.changed}>{fmtNumber(g)}<small>g</small></b>
              </button>
            </li>
          {/each}
        </ul>

        <button class="btn" class:tinted={done} onclick={onToggle}>
          {#if done}Annulla «fatto»{:else}<Check size={20} weight="bold" /> Fatto{/if}
        </button>
        {#if onFree}<button class="link free-link" onclick={onFree}>Pasto libero</button>{/if}
        {#if hero || modified}<p class="foot num">{fmtNumber(eatenKcal)} kcal stimate{#if modified} (piano {fmtNumber(kcal)}){/if}</p>{/if}
      {/if}
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
  .compact.done:not(.open) .title { font-weight: 500; }

  .hero-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
  h2 { font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0; color: var(--accent); }
  .now { font-size: 13px; font-weight: 700; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); padding: 4px 10px; border-radius: 999px; }

  .head { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 60px; padding: 10px 14px; background: none; border: 0; text-align: left; color: inherit; }
  .dot { display: flex; color: var(--on-hour); }
  .open .dot { color: var(--accent); }
  .grow { flex: 1; min-width: 0; }
  .slot { display: block; font-size: 13px; font-weight: 700; color: var(--on-hour-2); }
  .open .slot { color: var(--accent); }
  .skip { margin-left: 8px; font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: var(--veil-2); color: var(--on-hour); }
  .open .skip { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .title { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kcal { font-size: 14px; color: var(--on-hour-2); }
  .open .kcal { color: var(--ink-2); }
  .open .title { white-space: normal; }
  .caret { color: var(--on-hour-2); display: flex; transition: transform 0.25s var(--ease-out); }
  .open .caret { color: var(--ink-3); }
  .caret.up { transform: rotate(180deg); }
  .compact .body { padding: 0 16px 16px; }

  .items { list-style: none; margin: 0 0 10px; padding: 0; }
  .item { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; width: 100%; min-height: 48px; padding: 10px 0; border: 0; background: none; text-align: left; border-top: 1px solid var(--sep); font-size: 17px; color: var(--ink); }
  li:first-child .item { border-top: 0; }
  .name { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
  .name > span { display: inline-flex; align-items: center; gap: 6px; }
  .name small { font-size: 13px; font-weight: 600; color: var(--ink-2); margin-top: 2px; }
  .item.sub .name :global(svg) { color: var(--accent); flex: none; }
  /* Quello che è diverso dal piano: nel colore del pasto. */
  .chg, .name small.chg, .item b.chg { color: var(--accent); }
  .tag { font-size: 12px; font-weight: 750; padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .item b { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
  .item b small { font-size: 15px; font-weight: 700; margin-left: 2px; color: var(--ink-2); letter-spacing: 0; }
  .compact .item b { font-size: 21px; }

  .free-link { display: block; width: 100%; text-align: center; font-size: 15px; margin-top: 4px; }
  .foot { text-align: center; margin: 10px 0 0; font-size: 13px; color: var(--ink-2); }
</style>
