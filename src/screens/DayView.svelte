<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import { app } from '../state/app.svelte';
  import { router } from '../state/router.svelte';
  import type { PlanItem } from '../domain/types';
  import { nextMeal, skippedMeals, sortMeals, weekdayIndex } from '../domain/schedule';
  import { SLOT_LABEL } from '../domain/types';
  import { fmtNumber, rounded, sumMacro } from '../domain/nutrition';
  import { longDate, weekdayName } from '../ui/format';
  import DayStrip from '../ui/DayStrip.svelte';
  import MealCard from './MealCard.svelte';
  import SubsSheet from './SubsSheet.svelte';

  let { date }: { date: string } = $props();

  const isToday = $derived(date === app.today);
  const day = $derived(app.plan?.days[weekdayIndex(date)]);
  const meals = $derived(day ? sortMeals(day.meals) : []);
  const done = $derived(app.done(date));
  const now = $derived(isToday ? nextMeal(day, done) : null);
  const skipped = $derived(isToday ? skippedMeals(day, done).map((m) => m.slot) : []);
  const planned = $derived(rounded(sumMacro(meals, app.foodIndex)));
  const eaten = $derived(rounded(sumMacro(meals.filter((m) => done.has(m.slot)), app.foodIndex)));
  const rest = $derived(meals.filter((m) => m.slot !== now?.slot));
  const segments = $derived(meals.map((m) => ({ slot: m.slot, done: done.has(m.slot), current: m.slot === now?.slot })));

  let subsItem = $state<PlanItem | null>(null);
</script>

<main class="screen">
  {#if !isToday}
    <button class="back ground-link" onclick={() => router.back('settimana')}><CaretLeft size={20} weight="bold" /> Settimana</button>
  {/if}
  <h1 class="large-title">{isToday ? 'Oggi' : weekdayName(date)}</h1>
  <p class="subtitle">{longDate(date)}</p>

  {#each app.notices as n, i (i)}<div class="notice">{n}</div>{/each}

  {#if !app.plan}
    <div class="card empty">
      <p>Non c'è ancora un piano attivo.</p>
      <a class="btn" href="#/piano">Crea il piano</a>
    </div>
  {:else}
    {#if now}
      <MealCard meal={now} done={false} hero onToggle={() => app.toggleMeal(date, now.slot)} onSubs={(it) => (subsItem = it)} />
    {:else if isToday && skipped.length}
      <div class="card complete">
        <h2>Nessun altro pasto in programma</h2>
        <p class="muted">
          Non hai segnato {skipped.map((s) => SLOT_LABEL[s].toLowerCase()).join(' e ')}.
          {skipped.length > 1 ? 'Se li hai mangiati, segnali qui sotto.' : 'Se l’hai mangiato, segnalo qui sotto.'}
        </p>
      </div>
    {:else if isToday && meals.length}
      <div class="card complete">
        <h2>Giornata completata</h2>
        <p class="muted">Tutti i pasti del piano sono segnati.</p>
      </div>
    {/if}

    {#if meals.length}
      <div class="totals">
        <DayStrip {segments} ground />
        <div class="figures">
          <div class="kcal"><b class="num">{fmtNumber(eaten.kcal)}</b><span class="num">di {fmtNumber(planned.kcal)} kcal</span></div>
          <dl>
            <div><dt>Proteine</dt><dd class="num">{eaten.p}<span>/{planned.p} g</span></dd></div>
            <div><dt>Carboidrati</dt><dd class="num">{eaten.c}<span>/{planned.c} g</span></dd></div>
            <div><dt>Grassi</dt><dd class="num">{eaten.f}<span>/{planned.f} g</span></dd></div>
          </dl>
        </div>
      </div>
    {/if}

    {#if rest.length}
      <h2 class="section-title">{now ? 'Il resto della giornata' : 'Pasti'}</h2>
      {#each rest as m (m.slot)}
        <MealCard meal={m} done={done.has(m.slot)} skipped={skipped.includes(m.slot)} onToggle={() => app.toggleMeal(date, m.slot)} onSubs={(it) => (subsItem = it)} />
      {/each}
    {/if}
    <p class="section-foot">Valori nutrizionali stimati da tabelle pubbliche: indicativi, non i calcoli del medico.</p>
  {/if}
</main>

<SubsSheet bind:item={subsItem} />

<style>
  .back { display: flex; align-items: center; gap: 4px; margin-left: -4px; padding: 0 0 8px; }
  .empty { text-align: center; }
  .empty .btn { margin-top: 10px; }
  .complete h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 4px; color: var(--act); }
  .complete p { margin: 0; }

  /* I totali stanno sul fondo, senza scheda: la scheda resta solo al pasto di adesso. */
  .totals { padding: 4px 4px 0; }
  .figures { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 14px; margin-top: 12px; }
  .kcal b { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
  .kcal span { font-size: 15px; font-weight: 600; color: var(--on-hour-2); margin-left: 4px; }
  dl { display: flex; gap: 14px; margin: 0; }
  dl div { display: flex; flex-direction: column; }
  dt { font-size: 12px; font-weight: 600; color: var(--on-hour-2); }
  dd { margin: 0; font-size: 16px; font-weight: 750; }
  dd span { font-size: 12px; font-weight: 600; color: var(--on-hour-2); }
</style>
