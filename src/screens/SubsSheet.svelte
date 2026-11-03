<script module lang="ts">
  import type { PlanItem as Item, Slot as SlotName } from '../domain/types';

  export interface SubsTarget { date: string; slot: SlotName; index: number; item: Item }
</script>

<script lang="ts">
  import Minus from 'phosphor-svelte/lib/Minus';
  import Plus from 'phosphor-svelte/lib/Plus';
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import { SLOT_LABEL } from '../domain/types';
  import { fmtDecimal, fmtGrams } from '../domain/nutrition';
  import { choiceGrams } from '../domain/eaten';
  import { parseAmount } from '../domain/extras';
  import { ALTERNATIVE_SOURCES, alternativesFor } from '../domain/substitutions';
  import { app } from '../state/app.svelte';
  import { eatenState } from '../state/eaten.svelte';

  // Cosa si è preso oggi al posto di un alimento del piano: il piano stesso o
  // uno scambio del Dott. Occhino, e quanti grammi. Le alternative indicative
  // restano da consultare.
  let { target = $bindable(null) }: { target: SubsTarget | null } = $props();

  let open = $state(false);
  let tab = $state<'medico' | 'alt'>('medico');
  let last = $state<SubsTarget | null>(null);

  const name = (id: string) => app.foodIndex.get(id)?.name ?? 'Alimento sconosciuto';
  const log = $derived(last ? eatenState.forDate(last.date).find((l) => l.slot === last!.slot && l.index === last!.index && l.planFoodId === last!.item.foodId) : undefined);
  const foodId = $derived(last ? (log?.foodId ?? last.item.foodId) : '');
  const grams = $derived(last ? (log?.grams ?? last.item.grams) : 0);
  const options = $derived(last ? [{ foodId: last.item.foodId, grams: last.item.grams }, ...last.item.subs] : []);
  // Il campo dei grammi segue la scelta; scrivendoci lo si sovrascrive.
  let gramsText = $derived(fmtDecimal(grams));
  const alts = $derived(last ? alternativesFor(name(last.item.foodId), last.item.grams) : []);

  $effect(() => {
    if (target) {
      last = target;
      tab = 'medico';
      open = true;
    }
  });
  $effect(() => {
    if (!open) target = null;
  });

  function save(f: string, g: number) {
    if (!last || !(g > 0)) return;
    eatenState.set(last.date, last.slot, last.index, last.item, f, g);
  }
  function choose(f: string) {
    save(f, choiceGrams(last!.item, f) ?? grams);
  }
  function typed(text: string) {
    gramsText = text;
    const g = parseAmount(text);
    if (g !== null && g > 0) save(foodId, g);
  }
  const step = (d: number) => save(foodId, Math.max(5, Math.round((grams + d) / 5) * 5));
</script>

<Sheet bind:open title={last ? `${name(last.item.foodId)} · ${fmtGrams(last.item.grams)}` : ''}>
  {#if last}
    <p class="sub">Cosa hai preso oggi per {SLOT_LABEL[last.slot].toLowerCase()}</p>
    {#if alts.length}
      <Segmented bind:value={tab} options={[{ value: 'medico', label: 'Dott. Occhino' }, { value: 'alt', label: 'Alternative' }]} />
    {/if}

    {#if tab === 'medico'}
      <div class="group" role="radiogroup" aria-label="Alimento preso">
        {#each options as o, i (o.foodId)}
          <label class="row opt">
            <input type="radio" name="scelta" checked={foodId === o.foodId} onchange={() => choose(o.foodId)} />
            <span class="grow">{i === 0 ? 'Come da piano' : name(o.foodId)}{#if i === 0}<small>{name(o.foodId)}</small>{/if}</span>
            <b class="num">{fmtGrams(o.grams)}</b>
          </label>
        {/each}
      </div>
      {#if last.item.subs.length}<p class="section-foot">Gli scambi sono quelli scritti nel piano dal Dott. Occhino.</p>{/if}

      <h3 class="section-title">Quanto ne hai mangiato</h3>
      <div class="grams">
        <button class="step" aria-label="5 grammi in meno" disabled={grams <= 5} onclick={() => step(-5)}><Minus size={20} weight="bold" /></button>
        <label class="gv">
          <span class="field-row"><input inputmode="decimal" value={gramsText} oninput={(e) => typed(e.currentTarget.value)} aria-label="Grammi mangiati" autocomplete="off" /><i>g</i></span>
          <small>di {name(foodId).toLowerCase()} · {fmtGrams(choiceGrams(last.item, foodId) ?? last.item.grams)} previsti</small>
        </label>
        <button class="step" aria-label="5 grammi in più" onclick={() => step(5)}><Plus size={20} weight="bold" /></button>
      </div>
      {#if log}<button class="btn plain" onclick={() => eatenState.reset(last!.date, last!.slot, last!.index)}>Torna al piano</button>{/if}
    {:else}
      <div class="group">
        {#each alts as a (a.name)}
          <div class="row">
            <span class="grow">{a.name}<br /><span class="muted small">{a.note}</span></span>
            <b class="num">{fmtGrams(a.grams)}</b>
          </div>
        {/each}
      </div>
      <p class="section-foot">
        Equivalenze <b>indicative</b> da tabelle pubbliche, arrotondate a 5 g. Non fanno parte del piano: verificale con il medico.
        Fonti:
        {#each ALTERNATIVE_SOURCES as s, i (s.url)}<a href={s.url} target="_blank" rel="noopener">{s.label}</a>{i < ALTERNATIVE_SOURCES.length - 1 ? ', ' : '.'}{/each}
      </p>
    {/if}
  {/if}
</Sheet>

<style>
  .sub { margin: 0 4px 14px; font-size: 14px; color: var(--ink-2); }
  .opt { cursor: pointer; }
  .opt input { width: 22px; height: 22px; margin: 0; accent-color: var(--act); flex: none; }
  .opt small { display: block; font-size: 13px; color: var(--ink-2); }
  .grams { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px; border-radius: 18px; background: var(--card); box-shadow: 0 0 0 2px var(--act); }
  .step { width: 48px; height: 48px; flex: none; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--fill); color: var(--act); }
  .step:disabled { opacity: 0.35; }
  .gv { flex: 1; min-width: 0; text-align: center; }
  .field-row { display: inline-flex; align-items: baseline; gap: 4px; }
  .gv input { width: 4.6ch; border: 0; background: none; outline: none; text-align: right; font-size: 34px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); font-variant-numeric: tabular-nums; }
  .gv i { font-style: normal; font-size: 18px; font-weight: 700; color: var(--ink-2); }
  .gv small { display: block; font-size: 13px; font-weight: 600; color: var(--ink-2); }
  a { color: var(--act); }
</style>
