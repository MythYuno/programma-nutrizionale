<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import { app } from '../state/app.svelte';
  import { router } from '../state/router.svelte';
  import { addDays, isoWeek, mondayOf, weekDates, weekdayIndex } from '../domain/schedule';
  import { fmtNumber, sumMacro } from '../domain/nutrition';
  import { dayMonth, shortDate } from '../ui/format';

  let { week }: { week?: string } = $props();

  const anchor = $derived(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : app.today);
  const dates = $derived(weekDates(anchor));
  const isCurrent = $derived(mondayOf(anchor) === mondayOf(app.today));

  const rows = $derived(dates.map((date) => {
    const meals = app.plan?.days[weekdayIndex(date)]?.meals ?? [];
    const done = app.done(date);
    const eaten = sumMacro(meals.filter((m) => done.has(m.slot)), app.foodIndex);
    return { date, total: meals.length, done: meals.filter((m) => done.has(m.slot)).length, kcal: eaten.kcal };
  }));
  const past = $derived(rows.filter((r) => r.date <= app.today));
  const doneCount = $derived(past.reduce((s, r) => s + r.done, 0));
  const totalCount = $derived(past.reduce((s, r) => s + r.total, 0));
  const legacy = $derived([...app.legacyWeeks].sort((a, b) => b.week.localeCompare(a.week)));

  const goWeek = (n: number) => router.go('settimana/' + addDays(mondayOf(anchor), n * 7));
</script>

<main class="screen">
  <div class="eyebrow">Settimana {isoWeek(anchor).split('-W')[1]} · {dayMonth(dates[0]!)} – {dayMonth(dates[6]!)}</div>
  <div class="title-row">
    <h1 class="large-title">Settimana</h1>
    <div class="nav">
      <button class="icon" aria-label="Settimana precedente" onclick={() => goWeek(-1)}><CaretLeft size={22} /></button>
      <button class="icon" aria-label="Settimana successiva" disabled={isCurrent} onclick={() => goWeek(1)}><CaretRight size={22} /></button>
    </div>
  </div>

  <div class="card adherence">
    <span class="muted small">Aderenza {isCurrent ? 'finora' : 'della settimana'}</span>
    <div class="big num">{doneCount}<small>/{totalCount} pasti</small></div>
    <div class="bar"><i style="width:{totalCount ? (doneCount / totalCount) * 100 : 0}%"></i></div>
  </div>

  <div class="group">
    {#each rows as r (r.date)}
      <button class="row" onclick={() => router.go('giorno/' + r.date)}>
        <span class="grow" class:today={r.date === app.today}>{shortDate(r.date)}{r.date === app.today ? ' · oggi' : ''}</span>
        {#if r.date <= app.today || r.done}
          <span class="value">{r.done}/{r.total}{r.done ? ` · ${fmtNumber(r.kcal)} kcal` : ''}</span>
        {/if}
        <span class="dots" aria-hidden="true">
          {#each Array(r.total) as _, i (i)}<i class:on={i < r.done}></i>{/each}
        </span>
        <CaretRight size={16} class="chev" />
      </button>
    {/each}
  </div>
  <p class="section-foot">Tocca un giorno per vederlo o segnare un pasto dimenticato.</p>

  {#if legacy.length}
    <h2 class="section-title">Storico della versione precedente</h2>
    <div class="group">
      {#each legacy as w (w.week)}
        <div class="row"><span class="grow">Settimana {w.week.split('-W')[1]} · {w.week.slice(0, 4)}</span><span class="value">{w.done}/{w.total}</span></div>
      {/each}
    </div>
  {/if}
</main>

<style>
  .title-row { display: flex; align-items: center; justify-content: space-between; }
  .nav { display: flex; gap: 4px; }
  .icon { width: 40px; height: 40px; border-radius: 20px; border: 0; background: var(--fill); color: var(--blue); display: grid; place-items: center; }
  .icon:disabled { color: var(--text-3); }
  .big { font-size: 28px; font-weight: 700; }
  .big small { font-size: 15px; font-weight: 400; color: var(--text-2); }
  .bar { height: 6px; border-radius: 3px; background: var(--fill); margin-top: 8px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--green); border-radius: 3px; transition: width 0.4s; }
  .today { font-weight: 600; color: var(--blue); }
  .dots { display: flex; gap: 3px; }
  .dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--fill); }
  .dots i.on { background: var(--green); }
</style>
