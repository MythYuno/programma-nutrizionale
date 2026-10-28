<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';
  import Trash from 'phosphor-svelte/lib/Trash';
  import TrendDown from 'phosphor-svelte/lib/TrendDown';
  import TrendUp from 'phosphor-svelte/lib/TrendUp';
  import { app } from '../state/app.svelte';
  import { fmtKg, inRange, parseKg, sortByDate, trailingAverage, trend, weeklyChange, type Range } from '../domain/weight';
  import Segmented from '../ui/Segmented.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { shortDate } from '../ui/format';
  import WeightChart from './WeightChart.svelte';

  let range = $state<Range>('3M');
  let adding = $state(false);
  let editingGoal = $state(false);
  let kgInput = $state('');
  let dateInput = $state(app.today);
  let goalInput = $state('');
  let error = $state('');

  const avg = $derived(trailingAverage(app.weights, app.today));
  const change = $derived(weeklyChange(app.weights, app.today));
  const shown = $derived(inRange(app.weights, range, app.today));
  const points = $derived(trend(app.weights).filter((p) => shown.some((w) => w.date === p.date)));
  const history = $derived(sortByDate(app.weights).reverse());

  function openAdd() {
    const last = history[0];
    kgInput = last ? fmtKg(last.kg) : '';
    dateInput = app.today;
    error = '';
    adding = true;
  }
  async function save() {
    const kg = parseKg(kgInput);
    if (kg === null) { error = 'Inserisci un peso valido, per esempio 78,4.'; return; }
    if (!dateInput || dateInput > app.today) { error = 'La data non può essere nel futuro.'; return; }
    await app.addWeight({ date: dateInput, kg });
    adding = false;
  }
  function openGoal() {
    goalInput = app.settings.weightGoalKg ? fmtKg(app.settings.weightGoalKg) : '';
    error = '';
    editingGoal = true;
  }
  async function saveGoal() {
    if (!goalInput.trim()) { await app.updateSettings({ weightGoalKg: null }); editingGoal = false; return; }
    const kg = parseKg(goalInput);
    if (kg === null) { error = 'Inserisci un obiettivo valido.'; return; }
    await app.updateSettings({ weightGoalKg: kg });
    editingGoal = false;
  }
</script>

<main class="screen">
  <h1 class="large-title">Peso</h1>
  {#if avg !== null}
    <p class="subtitle">Media degli ultimi 7 giorni</p>
    <div class="big num">
      <span>{fmtKg(avg)}<span class="unit">kg</span></span>
      {#if change !== null && Math.abs(change) >= 0.05}
        <span class="delta">
          {#if change < 0}<TrendDown size={16} weight="bold" />{:else}<TrendUp size={16} weight="bold" />{/if}
          {change < 0 ? '−' : '+'}{fmtKg(Math.abs(change))} kg in una settimana
        </span>
      {/if}
    </div>
  {:else}
    <p class="subtitle">Nessuna pesata negli ultimi 7 giorni</p>
  {/if}

  <div class="card">
    {#if points.length >= 2}
      <WeightChart {points} goal={app.settings.weightGoalKg} />
      <Segmented bind:value={range} options={[{ value: '1M', label: '1M' }, { value: '3M', label: '3M' }, { value: '1A', label: '1A' }, { value: 'Tutto', label: 'Tutto' }]} />
      <p class="legend small muted"><i class="l-avg"></i> media 7 gg <i class="l-raw"></i> pesate {#if app.settings.weightGoalKg}<i class="l-goal"></i> obiettivo{/if}</p>
    {:else}
      <p class="muted small">Il grafico compare dalla seconda pesata.</p>
    {/if}
  </div>

  <button class="btn on-ground" onclick={openAdd}><Plus size={20} weight="bold" /> Pesata</button>

  <div class="group goal">
    <button class="row" onclick={openGoal}>
      <span class="grow">Obiettivo</span>
      <span class="value">{app.settings.weightGoalKg ? fmtKg(app.settings.weightGoalKg) + ' kg' : 'Nessuno'}</span>
    </button>
  </div>

  {#if history.length}
    <h2 class="section-title">Storico</h2>
    <div class="group">
      {#each history as w (w.date)}
        <div class="row">
          <span class="grow">{shortDate(w.date)} <span class="muted small">{w.date.slice(0, 4) !== app.today.slice(0, 4) ? w.date.slice(0, 4) : ''}</span></span>
          <b class="num">{fmtKg(w.kg)} kg</b>
          <button class="del" aria-label="Elimina pesata del {shortDate(w.date)}" onclick={() => app.removeWeight(w.date)}><Trash size={18} /></button>
        </div>
      {/each}
    </div>
  {/if}
</main>

<Sheet bind:open={adding} title="Nuova pesata">
  <label class="lab" for="kg">Peso (kg)</label>
  <!-- L'attributo autofocus vale solo al caricamento della pagina, non in un foglio aperto dopo. -->
  <input id="kg" class="field big-field num" inputmode="decimal" autocomplete="off" bind:value={kgInput} {@attach (el) => el.focus()} onkeydown={(e) => e.key === 'Enter' && save()} />
  <label class="lab" for="d">Data</label>
  <input id="d" class="field" type="date" max={app.today} bind:value={dateInput} />
  {#if error}<p class="err">{error}</p>{/if}
  <p class="muted small">Una pesata per giorno: se ne esiste già una, viene sostituita.</p>
  <button class="btn" onclick={save}>Salva</button>
</Sheet>

<Sheet bind:open={editingGoal} title="Obiettivo di peso">
  <label class="lab" for="g">Obiettivo (kg)</label>
  <input id="g" class="field big-field num" inputmode="decimal" autocomplete="off" bind:value={goalInput} placeholder="Facoltativo" />
  {#if error}<p class="err">{error}</p>{/if}
  <p class="muted small">Lascia vuoto per toglierlo. Compare come linea tratteggiata nel grafico.</p>
  <button class="btn" onclick={saveGoal}>Salva</button>
</Sheet>

<style>
  /* Il numero del peso sta sul fondo colorato; il grafico in scheda. */
  .big { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; font-size: 48px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin: -6px 4px 18px; }
  .unit { font-size: 20px; font-weight: 700; letter-spacing: 0; margin-left: 4px; color: var(--on-hour-2); }
  .delta { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; letter-spacing: 0; background: var(--veil); padding: 5px 10px; border-radius: 999px; }
  .legend { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin: 0; }
  .legend i { display: inline-block; width: 14px; height: 3px; border-radius: 2px; margin-left: 6px; }
  .l-avg { background: var(--act); }
  .l-raw { background: var(--ink-3); height: 6px !important; width: 6px !important; border-radius: 50% !important; }
  .l-goal { background: repeating-linear-gradient(90deg, var(--ink) 0 4px, transparent 4px 7px); }
  .goal { margin-top: 12px; }
  .del { border: 0; background: none; color: var(--danger); padding: 8px; margin-right: -8px; display: flex; }
  .lab { display: block; font-size: 14px; font-weight: 600; color: var(--ink-2); margin: 12px 4px 6px; }
  .big-field { font-size: 30px; font-weight: 750; }
  .err { color: var(--danger); font-size: 15px; }
  .btn { margin-top: 6px; }
</style>
