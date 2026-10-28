<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import Confetti from 'phosphor-svelte/lib/Confetti';
  import { app } from '../state/app.svelte';
  import { router } from '../state/router.svelte';
  import type { PlanItem } from '../domain/types';
  import { nextMeal, sortMeals, weekdayIndex } from '../domain/schedule';
  import { fmtNumber, rounded, sumMacro } from '../domain/nutrition';
  import { longDate, weekdayName } from '../ui/format';
  import Ring from '../ui/Ring.svelte';
  import MealCard from './MealCard.svelte';
  import SubsSheet from './SubsSheet.svelte';

  let { date }: { date: string } = $props();

  const isToday = $derived(date === app.today);
  const day = $derived(app.plan?.days[weekdayIndex(date)]);
  const meals = $derived(day ? sortMeals(day.meals) : []);
  const done = $derived(app.done(date));
  const now = $derived(isToday ? nextMeal(day, done) : null);
  const planned = $derived(rounded(sumMacro(meals, app.foodIndex)));
  const eaten = $derived(rounded(sumMacro(meals.filter((m) => done.has(m.slot)), app.foodIndex)));
  const rest = $derived(meals.filter((m) => m.slot !== now?.slot));

  let subsItem = $state<PlanItem | null>(null);
</script>

<main class="screen">
  {#if !isToday}
    <button class="back link" onclick={() => router.back('settimana')}><CaretLeft size={20} /> Settimana</button>
  {/if}
  <div class="eyebrow">{longDate(date)}</div>
  <h1 class="large-title">{isToday ? 'Oggi' : weekdayName(date)}</h1>

  {#each app.notices as n, i (i)}<div class="notice">{n}</div>{/each}

  {#if !app.plan}
    <div class="card empty">
      <p>Non c'è ancora un piano attivo.</p>
      <a class="btn" href="#/piano">Crea il piano</a>
    </div>
  {:else}
    {#if now}
      <MealCard meal={now} done={false} hero onToggle={() => app.toggleMeal(date, now.slot)} onSubs={(it) => (subsItem = it)} />
    {:else if isToday && meals.length}
      <div class="card complete">
        <Confetti size={32} color="var(--green)" />
        <div><b>Giornata completata</b><br /><span class="muted small">Tutti i pasti del piano sono segnati.</span></div>
      </div>
    {/if}

    <div class="card totals">
      <Ring value={planned.kcal ? eaten.kcal / planned.kcal : 0} label="{Math.round(planned.kcal ? (eaten.kcal / planned.kcal) * 100 : 0)}%" />
      <div class="grid">
        <div><span class="muted small">kcal</span><b class="num">{fmtNumber(eaten.kcal)}<small>/{fmtNumber(planned.kcal)}</small></b></div>
        <div><span class="muted small">Proteine</span><b class="num">{eaten.p}<small>/{planned.p} g</small></b></div>
        <div><span class="muted small">Carboidrati</span><b class="num">{eaten.c}<small>/{planned.c} g</small></b></div>
        <div><span class="muted small">Grassi</span><b class="num">{eaten.f}<small>/{planned.f} g</small></b></div>
      </div>
    </div>

    {#if rest.length}
      <h2 class="section-title">{now ? 'Il resto della giornata' : 'Pasti'}</h2>
      {#each rest as m (m.slot)}
        <MealCard meal={m} done={done.has(m.slot)} onToggle={() => app.toggleMeal(date, m.slot)} onSubs={(it) => (subsItem = it)} />
      {/each}
    {/if}
    <p class="section-foot">Valori nutrizionali stimati da tabelle pubbliche: indicativi, non i calcoli del medico.</p>
  {/if}
</main>

<SubsSheet bind:item={subsItem} />

<style>
  .back { display: flex; align-items: center; gap: 2px; margin-left: -6px; padding: 4px 0 6px; }
  .empty { text-align: center; }
  .empty .btn { text-decoration: none; margin-top: 8px; }
  .complete { display: flex; align-items: center; gap: 14px; }
  .totals { display: flex; align-items: center; gap: 16px; }
  .grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
  .grid div { display: flex; flex-direction: column; }
  .grid b { font-size: 17px; }
  .grid small { font-weight: 400; color: var(--text-2); font-size: 13px; }
</style>
