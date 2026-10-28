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
  <h1 class="large-title top">Peso</h1>

  <div class="card">
    {#if avg !== null}
      <span class="muted small">Media 7 giorni</span>
      <div class="big num">
        {fmtKg(avg)} kg
        {#if change !== null && Math.abs(change) >= 0.05}
          <span class="delta" class:down={change < 0}>
            {#if change < 0}<TrendDown size={16} weight="bold" />{:else}<TrendUp size={16} weight="bold" />{/if}
            {fmtKg(Math.abs(change))}
          </span>
        {/if}
      </div>
    {:else}
      <span class="muted small">Nessuna pesata negli ultimi 7 giorni</span>
    {/if}

    {#if points.length >= 2}
      <WeightChart {points} goal={app.settings.weightGoalKg} />
      <Segmented bind:value={range} options={[{ value: '1M', label: '1M' }, { value: '3M', label: '3M' }, { value: '1A', label: '1A' }, { value: 'Tutto', label: 'Tutto' }]} />
      <p class="legend small muted"><i class="l-avg"></i> media 7 gg <i class="l-raw"></i> pesate {#if app.settings.weightGoalKg}<i class="l-goal"></i> obiettivo{/if}</p>
    {:else}
      <p class="muted small">Il grafico compare dalla seconda pesata.</p>
    {/if}
  </div>

  <button class="btn" onclick={openAdd}><Plus size={20} weight="bold" /> Pesata</button>

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
  .top { margin-top: 18px; }
  .big { font-size: 30px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .delta { display: inline-flex; align-items: center; gap: 2px; font-size: 15px; color: var(--orange); }
  .delta.down { color: var(--green); }
  .legend { display: flex; align-items: center; gap: 6px; margin: 0; }
  .legend i { display: inline-block; width: 14px; height: 3px; border-radius: 2px; margin-left: 6px; }
  .l-avg { background: var(--blue); }
  .l-raw { background: var(--text-3); height: 6px !important; width: 6px !important; border-radius: 50% !important; }
  .l-goal { background: repeating-linear-gradient(90deg, var(--green) 0 4px, transparent 4px 7px); }
  .goal { margin-top: 12px; }
  .del { border: 0; background: none; color: var(--red); padding: 6px; margin-right: -6px; display: flex; }
  .lab { display: block; font-size: 13px; color: var(--text-2); margin: 10px 4px 6px; text-transform: uppercase; }
  .big-field { font-size: 28px; font-weight: 600; }
  .err { color: var(--red); font-size: 15px; }
  .btn { margin-top: 4px; }
</style>
