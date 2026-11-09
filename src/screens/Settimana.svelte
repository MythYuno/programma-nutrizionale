<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import { app } from '../state/app.svelte';
  import { extrasState } from '../state/extras.svelte';
  import { router } from '../state/router.svelte';
  import { addDays, isoWeek, mondayOf, sortMeals, weekDates, weekdayIndex } from '../domain/schedule';
  import { fmtNumber } from '../domain/nutrition';
  import { dayBalance, FREE_MEALS_PER_WEEK, weekSummary } from '../domain/extras';
  import { eatenState } from '../state/eaten.svelte';
  import { shortDate, weekRange } from '../ui/format';
  import { swipe } from '../ui/swipe';
  import DayStrip from '../ui/DayStrip.svelte';

  let { week }: { week?: string } = $props();

  const anchor = $derived(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : app.today);
  const dates = $derived(weekDates(anchor));
  const isCurrent = $derived(mondayOf(anchor) === mondayOf(app.today));

  const rows = $derived(dates.map((date) => {
    const meals = sortMeals(app.plan?.days[weekdayIndex(date)]?.meals ?? []);
    const done = app.done(date);
    const frees = app.frees(date);
    const b = dayBalance(meals, done, frees, extrasState.forDate(date), app.foodIndex, eatenState.forDate(date));
    const segments = meals.map((m) => ({ slot: m.slot, done: done.has(m.slot), free: frees.has(m.slot) }));
    const extra = Math.round(b.offPlan.kcal + b.free.kcal);
    return { date, total: meals.length, done: segments.filter((s) => s.done).length, kcal: b.total.kcal, extra, segments };
  }));
  const past = $derived(rows.filter((r) => r.date <= app.today));
  const doneCount = $derived(past.reduce((s, r) => s + r.done, 0));
  const totalCount = $derived(past.reduce((s, r) => s + r.total, 0));
  const summary = $derived(weekSummary(past.map((r) => r.date), app.logs, extrasState.extras));
  const legacy = $derived([...app.legacyWeeks].sort((a, b) => b.week.localeCompare(a.week)));

  const goWeek = (n: number) => router.go('settimana/' + addDays(mondayOf(anchor), n * 7));
</script>

<main class="screen" {@attach swipe(goWeek)}>
  <div class="title-row">
    <h1 class="large-title">Settimana</h1>
    <div class="title-nav">
      <button class="icon-btn" aria-label="Settimana precedente" onclick={() => goWeek(-1)}><CaretLeft size={22} weight="bold" /></button>
      <button class="icon-btn" aria-label="Settimana successiva" onclick={() => goWeek(1)}><CaretRight size={22} weight="bold" /></button>
    </div>
  </div>
  <p class="subtitle">Settimana {isoWeek(anchor).split('-W')[1]}, {weekRange(dates[0]!, dates[6]!)}</p>

  <!-- Una settimana che deve ancora cominciare non ha niente da contare. -->
  {#if past.length}
  <div class="adherence">
    <div class="big num">{doneCount}<span>di {totalCount} pasti {isCurrent ? 'finora' : 'nella settimana'}</span></div>
    <div class="bar"><i style="width:{totalCount ? (doneCount / totalCount) * 100 : 0}%"></i></div>
  </div>

  <!-- Fuori piano della settimana: una riga velata, due numeri affiancati. -->
  <div class="week" class:over={summary.freeMeals > FREE_MEALS_PER_WEEK}>
    <div class="stat"><span>Pasto libero</span><b class="num">{summary.freeMeals} su {FREE_MEALS_PER_WEEK}</b></div>
    <div class="stat"><span>Sgarri</span><b class="num">{summary.offPlanKcal ? `${fmtNumber(summary.offPlanKcal)} kcal in ${summary.offPlanDays} ${summary.offPlanDays === 1 ? 'giorno' : 'giorni'}` : 'nessuno'}</b></div>
    {#if summary.freeMeals > FREE_MEALS_PER_WEEK}<small>Il piano ne prevede uno a settimana</small>{/if}
  </div>
  {/if}

  <div class="group">
    {#each rows as r (r.date)}
      <!-- Griglia: nome e numeri sopra, striscia sotto a tutta larghezza, così le striscette sono allineate. -->
      <button class="row day" class:today={r.date === app.today} onclick={() => router.go('giorno/' + r.date)}>
        <span class="name">{shortDate(r.date)}{#if r.date === app.today}<span class="pill">oggi</span>{/if}</span>
        {#if r.date <= app.today || r.done}
          <span class="value num"><b>{r.done}/{r.total}</b>{#if r.done || r.extra}<span class="small">{fmtNumber(r.kcal)} kcal{#if r.extra}&nbsp;· +{fmtNumber(r.extra)}{/if}</span>{/if}</span>
        {/if}
        <CaretRight size={16} weight="bold" class="chev" />
        {#if r.total}<span class="strip"><DayStrip segments={r.segments} size="sm" /></span>{/if}
      </button>
    {/each}
  </div>
  <p class="section-foot">Tocca un giorno per vederlo o segnare un pasto dimenticato. Scorri di lato per cambiare settimana.</p>

  {#if legacy.length}
    <h2 class="section-title">Storico della versione precedente</h2>
    <div class="group">
      {#each legacy as w (w.week)}
        <div class="row"><span class="grow">Settimana {w.week.split('-W')[1]} del {w.week.slice(0, 4)}</span><span class="value">{w.done}/{w.total}</span></div>
      {/each}
    </div>
  {/if}
</main>

<style>
  .adherence { padding: 0 4px 18px; }
  .big { font-size: 40px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .big span { font-size: 15px; font-weight: 600; letter-spacing: 0; color: var(--on-hour-2); margin-left: 8px; }
  .bar { height: 8px; border-radius: 4px; background: var(--veil-2); margin-top: 12px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--on-hour); border-radius: 4px; transition: width 0.5s var(--ease-out); }
  /* Riepilogo del fuori piano: righe velate sul fondo, come gli sgarri in Oggi. */
  .week { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; margin: 0 0 16px; padding: 12px 14px; border-radius: var(--radius-row); background: var(--veil); }
  .stat { display: grid; gap: 2px; min-width: 0; }
  .stat + .stat { padding-left: 14px; border-left: 1px solid var(--veil-2); }
  .stat span { font-size: 13px; font-weight: 650; color: var(--on-hour-2); }
  .stat b { font-size: 16px; font-weight: 750; color: var(--on-hour); }
  .week small { grid-column: 1 / -1; font-size: 13px; font-weight: 600; color: var(--on-hour); }
  .day { display: grid; grid-template-columns: 1fr auto 16px; align-items: center; gap: 10px 10px; min-height: 64px; }
  .name { font-weight: 600; display: flex; align-items: center; gap: 8px; min-width: 0; }
  .today .name { color: var(--act); }
  .pill { font-size: 12px; font-weight: 700; color: var(--act); background: color-mix(in srgb, var(--act) 12%, transparent); padding: 2px 8px; border-radius: 999px; }
  .value { grid-column: 2; display: flex; align-items: baseline; gap: 8px; }
  .value b { color: var(--ink); font-weight: 700; }
  .day :global(.chev) { grid-column: 3; }
  .strip { grid-column: 1 / 3; }
</style>
