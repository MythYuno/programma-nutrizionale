<script lang="ts">
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import Plus from 'phosphor-svelte/lib/Plus';
  import Copy from 'phosphor-svelte/lib/Copy';
  import { app } from '../../state/app.svelte';
  import { editor } from '../../state/editor.svelte';
  import { DAY_NAMES } from '../../domain/validate';
  import { SLOT_LABEL } from '../../domain/types';
  import { fmtNumber, rounded, sumMacro } from '../../domain/nutrition';
  import Segmented from '../../ui/Segmented.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import MealEditor from './MealEditor.svelte';

  editor.ensure();

  const dayOptions = DAY_NAMES.map((n, i) => ({ value: String(i), label: n.slice(0, 3) }));

  const total = $derived(rounded(sumMacro(editor.meals, app.foodIndex)));
  let copying = $state(false);
  let targets = $state<number[]>([]);
  let saved = $state(false);
  let backupDue = $derived(!app.settings.lastBackupAt || Date.now() - Date.parse(app.settings.lastBackupAt) > 30 * 864e5);

  async function save() {
    saved = await editor.save();
    if (saved) setTimeout(() => (saved = false), 2000);
  }
  function openCopy() {
    targets = [];
    copying = true;
  }
</script>

<main class="screen">
  <div class="top">
    <h1 class="large-title">Piano</h1>
    {#if editor.dirty}
      <div class="actions">
        <button class="ground-link" onclick={() => editor.reset()}>Annulla</button>
        <button class="btn on-ground save" onclick={save}>Salva</button>
      </div>
    {:else if saved}
      <span class="ok">Salvato ✓</span>
    {/if}
  </div>

  {#if editor.issues.length}
    <div class="notice" role="alert">
      <b>Il piano non è stato salvato.</b>
      <ul>{#each editor.issues.slice(0, 6) as i, k (k)}<li>{i.message}</li>{/each}</ul>
      {#if editor.issues.length > 6}<span class="small">…e altri {editor.issues.length - 6}.</span>{/if}
    </div>
  {/if}

  {#if editor.draft}
    <div class="group">
      <label class="row">
        <span class="muted">Nome</span>
        <input class="grow inline" bind:value={editor.draft.name} oninput={() => editor.touch()} aria-label="Nome del piano" />
      </label>
    </div>

    <Segmented ground bind:value={() => String(editor.day), (v) => (editor.day = Number(v))} options={dayOptions} />

    <div class="day-head">
      <span class="dh"><b>{DAY_NAMES[editor.day]}</b><span class="tot num">{fmtNumber(total.kcal)} kcal · P {total.p} · C {total.c} · G {total.f}</span></span>
      <button class="ground-link small-link" onclick={openCopy}><Copy size={16} /> Copia su…</button>
    </div>

    {#each editor.meals as meal (meal.slot)}
      <MealEditor slot={meal.slot} />
    {:else}
      <p class="center empty">Nessun pasto in questo giorno.</p>
    {/each}

    {#if editor.missingSlots().length}
      <div class="add-meal">
        {#each editor.missingSlots() as s (s)}
          <button class="chip" onclick={() => editor.addMeal(s)}><Plus size={14} weight="bold" /> {SLOT_LABEL[s]}</button>
        {/each}
      </div>
    {/if}
  {/if}

  <h2 class="section-title">Dati</h2>
  <div class="group">
    <a class="row" href="#/piano/alimenti"><span class="grow">Catalogo alimenti</span><span class="value">{app.foods.length}</span><CaretRight size={16} class="chev" /></a>
    <a class="row" href="#/piano/backup"><span class="grow">Backup e impostazioni</span>{#if backupDue}<span class="badge">Backup</span>{/if}<CaretRight size={16} class="chev" /></a>
  </div>
</main>

<Sheet bind:open={copying} title="Copia {DAY_NAMES[editor.day]} su…">
  <div class="group">
    {#each DAY_NAMES as n, i (i)}
      {#if i !== editor.day}
        <label class="row">
          <span class="grow">{n}</span>
          <input type="checkbox" checked={targets.includes(i)} onchange={(e) => (targets = e.currentTarget.checked ? [...targets, i] : targets.filter((t) => t !== i))} />
        </label>
      {/if}
    {/each}
  </div>
  <p class="section-foot">I pasti dei giorni scelti vengono sostituiti. Le modifiche diventano effettive solo con «Salva».</p>
  <button class="btn" disabled={!targets.length} onclick={() => { editor.copyDayTo(targets); copying = false; }}>Copia su {targets.length} {targets.length === 1 ? 'giorno' : 'giorni'}</button>
</Sheet>

<style>
  .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }

  .actions { display: flex; align-items: center; gap: 14px; }
  .save { width: auto; min-height: 36px; padding: 0 18px; border-radius: 18px; font-size: 15px; }
  .ok { color: var(--on-hour); font-weight: 700; }
  .dh { display: flex; flex-direction: column; gap: 2px; }
  .dh b { font-size: 20px; font-weight: 800; letter-spacing: -0.015em; }
  .tot { color: var(--on-hour-2); font-weight: 600; font-size: 14px; }
  .empty { color: var(--on-hour-2); }
  .notice ul { margin: 6px 0 0; padding-left: 18px; }
  .inline { border: 0; background: none; outline: none; text-align: right; font-size: 17px; }
  a.row { color: inherit; text-decoration: none; }
  .day-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 4px 10px; font-size: 15px; }
  .small-link { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; white-space: nowrap; }
  .center { text-align: center; }
  .add-meal { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 8px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; border: 0; border-radius: 999px; background: var(--veil); color: var(--on-hour); padding: 9px 14px; font-size: 15px; font-weight: 600; }
  .badge { background: var(--warn); color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 12px; font-weight: 600; }
</style>
