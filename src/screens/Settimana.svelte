<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import { app } from '../state/app.svelte';
  import { router } from '../state/router.svelte';
  import { addDays, isoWeek, mondayOf, sortMeals, weekDates, weekdayIndex } from '../domain/schedule';
  import { fmtNumber, sumMacro } from '../domain/nutrition';
  import { dayMonth, shortDate } from '../ui/format';
  import DayStrip from '../ui/DayStrip.svelte';

  let { week }: { week?: string } = $props();

  const anchor = $derived(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : app.today);
  const dates = $derived(weekDates(anchor));
  const isCurrent = $derived(mondayOf(anchor) === mondayOf(app.today));

  const rows = $derived(dates.map((date) => {
    const meals = sortMeals(app.plan?.days[weekdayIndex(date)]?.meals ?? []);
    const done = app.done(date);
    const eaten = sumMacro(meals.filter((m) => done.has(m.slot)), app.foodIndex);
    const segments = meals.map((m) => ({ slot: m.slot, done: done.has(m.slot) }));
    return { date, total: meals.length, done: segments.filter((s) => s.done).length, kcal: eaten.kcal, segments };
  }));
  const past = $derived(rows.filter((r) => r.date <= app.today));
  const doneCount = $derived(past.reduce((s, r) => s + r.done, 0));
  const totalCount = $derived(past.reduce((s, r) => s + r.total, 0));
  const legacy = $derived([...app.legacyWeeks].sort((a, b) => b.week.localeCompare(a.week)));

  const goWeek = (n: number) => router.go('settimana/' + addDays(mondayOf(anchor), n * 7));

  // Swipe orizzontale per cambiare settimana; le frecce restano per chi non lo usa.
  let start: { x: number; y: number } | null = null;
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    start = t ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    if (dx > 0) goWeek(-1);
    else if (!isCurrent) goWeek(1);
  }
</script>

<main class="screen" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
  <div class="title-row">
    <h1 class="large-title">Settimana</h1>
    <div class="nav">
      <button class="icon-btn" aria-label="Settimana precedente" onclick={() => goWeek(-1)}><CaretLeft size={22} weight="bold" /></button>
      <button class="icon-btn" aria-label="Settimana successiva" disabled={isCurrent} onclick={() => goWeek(1)}><CaretRight size={22} weight="bold" /></button>
    </div>
  </div>
  <p class="subtitle">Settimana {isoWeek(anchor).split('-W')[1]}, dal {dayMonth(dates[0]!)} al {dayMonth(dates[6]!)}</p>

  <div class="adherence">
    <div class="big num">{doneCount}<span>di {totalCount} pasti {isCurrent ? 'finora' : 'nella settimana'}</span></div>
    <div class="bar"><i style="width:{totalCount ? (doneCount / totalCount) * 100 : 0}%"></i></div>
  </div>

  <div class="group">
    {#each rows as r (r.date)}
      <button class="row day" class:today={r.date === app.today} onclick={() => router.go('giorno/' + r.date)}>
        <span class="grow">
          <span class="name">{shortDate(r.date)}{#if r.date === app.today}<span class="pill">oggi</span>{/if}</span>
          {#if r.total}<DayStrip segments={r.segments} size="sm" />{/if}
        </span>
        {#if r.date <= app.today || r.done}
          <span class="value"><b>{r.done}/{r.total}</b>{#if r.done}<br /><span class="small">{fmtNumber(r.kcal)} kcal</span>{/if}</span>
        {/if}
        <CaretRight size={16} weight="bold" class="chev" />
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
  .title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .nav { display: flex; gap: 8px; }
  .adherence { padding: 0 4px 18px; }
  .big { font-size: 40px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .big span { font-size: 15px; font-weight: 600; letter-spacing: 0; color: var(--on-hour-2); margin-left: 8px; }
  .bar { height: 8px; border-radius: 4px; background: var(--veil-2); margin-top: 12px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--on-hour); border-radius: 4px; transition: width 0.5s var(--ease-out); }
  .day { min-height: 64px; }
  .day .grow { display: flex; flex-direction: column; gap: 8px; }
  .name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .today .name { color: var(--act); }
  .pill { font-size: 12px; font-weight: 700; color: var(--act); background: color-mix(in srgb, var(--act) 12%, transparent); padding: 2px 8px; border-radius: 999px; }
  .value { text-align: right; line-height: 1.25; }
  .value b { color: var(--ink); font-weight: 700; }
</style>
