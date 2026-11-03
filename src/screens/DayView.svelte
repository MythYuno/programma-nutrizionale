<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import { app } from '../state/app.svelte';
  import { extrasState } from '../state/extras.svelte';
  import { eatenState } from '../state/eaten.svelte';
  import { router } from '../state/router.svelte';
  import type { Meal, Slot } from '../domain/types';
  import { nextMeal, skippedMeals, sortMeals, weekdayIndex } from '../domain/schedule';
  import { SLOT_LABEL } from '../domain/types';
  import { dayBalance } from '../domain/extras';
  import { eatenItems } from '../domain/eaten';
  import { longDate, weekdayName } from '../ui/format';
  import DayStrip from '../ui/DayStrip.svelte';
  import BalanceBar from '../ui/BalanceBar.svelte';
  import Fab from '../ui/Fab.svelte';
  import MealCard from './MealCard.svelte';
  import SubsSheet, { type SubsTarget } from './SubsSheet.svelte';
  import BalanceSheet from './extras/BalanceSheet.svelte';
  import AddExtraSheet from './extras/AddExtraSheet.svelte';
  import ExtraList from './extras/ExtraList.svelte';
  import ExtraItemSheet from './extras/ExtraItemSheet.svelte';
  import Toast from '../ui/Toast.svelte';

  let { date }: { date: string } = $props();

  const isToday = $derived(date === app.today);
  const day = $derived(app.plan?.days[weekdayIndex(date)]);
  const meals = $derived(day ? sortMeals(day.meals) : []);
  const done = $derived(app.done(date));
  const frees = $derived(app.frees(date));
  const now = $derived(isToday ? nextMeal(day, done) : null);
  const skipped = $derived(isToday ? skippedMeals(day, done).map((m) => m.slot) : []);
  const dayExtras = $derived(extrasState.forDate(date));
  const dayLogs = $derived(eatenState.forDate(date));
  const balance = $derived(dayBalance(meals, done, frees, dayExtras, app.foodIndex, dayLogs));
  const rest = $derived(meals.filter((m) => m.slot !== now?.slot));
  const segments = $derived(meals.map((m) => ({ slot: m.slot, done: done.has(m.slot), current: m.slot === now?.slot, free: frees.has(m.slot) })));
  // Nei giorni futuri non si aggiunge niente: si mangia solo oggi o prima.
  const canAdd = $derived(date <= app.today);

  let subsTarget = $state<SubsTarget | null>(null);
  let details = $state(false);
  let adding = $state(false);
  let addSlot = $state<Slot | null>(null); // pasto libero a cui si aggiunge, null = sgarro
  let itemId = $state<string | null>(null); // voce di un pasto libero aperta
  let itemOpen = $state(false);

  function openAdd(slot: Slot | null) {
    addSlot = slot;
    adding = true;
  }

  // Un alimento del pasto toccato: si apre «cosa hai preso».
  function openItem(m: Meal, index: number) {
    const item = m.items[index];
    if (item) subsTarget = { date, slot: m.slot, index, item };
  }

  async function markFree(slot: Slot) {
    await extrasState.markFree(date, slot);
    openAdd(slot);
  }
</script>

<main class="screen" class:with-fab={canAdd}>
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
  {:else if now}
    <MealCard meal={now} done={false} hero eaten={eatenItems(now, dayLogs, date)} onToggle={() => app.toggleMeal(date, now.slot)} onItem={(i) => openItem(now, i)} onFree={canAdd ? () => markFree(now.slot) : undefined} />
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

  {#if meals.length || dayExtras.length}
    <div class="totals">
      {#if meals.length}<DayStrip {segments} ground />{/if}
      <BalanceBar {balance} onDetails={() => (details = true)} />
    </div>
  {/if}

  {#if rest.length}
    <h2 class="section-title">{now ? 'Il resto della giornata' : 'Pasti'}</h2>
    {#each rest as m (m.slot)}
      <MealCard
        meal={m} done={done.has(m.slot)} skipped={skipped.includes(m.slot)}
        free={frees.has(m.slot)} freeItems={dayExtras.filter((e) => e.freeSlot === m.slot)}
        eaten={eatenItems(m, dayLogs, date)}
        onToggle={() => app.toggleMeal(date, m.slot)} onItem={(i) => openItem(m, i)}
        onFree={canAdd ? () => markFree(m.slot) : undefined}
        onUnfree={() => extrasState.unmarkFree(date, m.slot)} onAddToFree={() => openAdd(m.slot)}
        onOpenExtra={(id) => { itemId = id; itemOpen = true; }}
      />
    {/each}
  {/if}
  <ExtraList {date} />
  {#if meals.length || dayExtras.length}<p class="section-foot">Valori nutrizionali stimati da tabelle pubbliche: indicativi, non i calcoli del medico.</p>{/if}
</main>

{#if canAdd}<Fab label="Ho mangiato altro" onclick={() => openAdd(null)} />{/if}

<SubsSheet bind:target={subsTarget} />
<BalanceSheet bind:open={details} {balance} />
<AddExtraSheet bind:open={adding} {date} freeSlot={addSlot} />
<ExtraItemSheet bind:open={itemOpen} extraId={itemId} />
<Toast />

<style>
  .back { display: flex; align-items: center; gap: 4px; margin-left: -4px; padding: 0 0 8px; }
  .empty { text-align: center; }
  .empty .btn { margin-top: 10px; }
  .complete h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 4px; color: var(--act); }
  .complete p { margin: 0; }

  /* Il conto sta sul fondo, senza scheda: la scheda resta solo al pasto di adesso. */
  .totals { display: grid; gap: 14px; padding: 4px 4px 0; }
  /* Spazio in fondo perché il pulsante fisso non copra l'ultima voce. */
  .with-fab { padding-bottom: calc(env(safe-area-inset-bottom) + 172px); }
</style>
