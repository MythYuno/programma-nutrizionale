<script lang="ts">
  import type { DayBalance } from '../domain/extras';
  import { fmtNumber } from '../domain/nutrition';

  // Il conto del giorno: parte piena = dal piano, parte rigata = fuori piano e
  // pasto libero, tacca = kcal del piano. Nessun colore d'allarme.
  let { balance, onDetails }: { balance: DayBalance; onDetails: () => void } = $props();

  const extra = $derived(balance.free.kcal + balance.offPlan.kcal);
  const scale = $derived(Math.max(balance.planned.kcal, balance.total.kcal, 1));
  const hasPlan = $derived(balance.planned.kcal > 0);
  // VoiceOver non vede la barra: i numeri vanno detti per esteso.
  const label = $derived.by(() => {
    const parts = [];
    if (balance.offPlan.kcal > 0) parts.push(`${fmtNumber(balance.offPlan.kcal)} fuori piano`);
    if (balance.free.kcal > 0) parts.push(`${fmtNumber(balance.free.kcal)} da pasto libero`);
    return `Bilancio del giorno: ${fmtNumber(balance.total.kcal)} kcal`
      + (hasPlan ? ` di ${fmtNumber(balance.planned.kcal)} previste` : '')
      + (parts.length ? `, di cui ${parts.join(' e ')}` : '') + '. Dettagli';
  });
  const pct = (k: number) => `${Math.min(100, (k / scale) * 100)}%`;
</script>

<button class="bal" aria-label={label} onclick={onDetails}>
  <span class="num">
    <b class="n">{fmtNumber(balance.total.kcal)}</b>
    <!-- Senza piano non c'è un "di quanto": solo il totale. -->
    <span class="of">{#if hasPlan}di {fmtNumber(balance.planned.kcal)} kcal{#if balance.delta > 0}&nbsp;· +{fmtNumber(balance.delta)}{/if}{:else}kcal{/if}</span>
  </span>
  <span class="bar" aria-hidden="true">
    <i class="p" style:width={pct(balance.fromPlan.kcal)}></i><i class="x" style:width={pct(extra)}></i>
    {#if hasPlan}<i class="tick" style:left={pct(balance.planned.kcal)}></i>{/if}
  </span>
  <span class="leg">
    {#if hasPlan}<span><i class="sw"></i>Piano {fmtNumber(balance.fromPlan.kcal)}</span>{/if}
    {#if balance.offPlan.kcal > 0}<span><i class="sw h"></i>Fuori piano {fmtNumber(balance.offPlan.kcal)}</span>{/if}
    {#if balance.free.kcal > 0}<span><i class="sw h"></i>Pasto libero {fmtNumber(balance.free.kcal)}</span>{/if}
  </span>
</button>

<style>
  .bal { display: block; width: 100%; padding: 4px 4px 0; border: 0; background: none; color: var(--on-hour); text-align: left; }
  .num { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .n { font-size: 32px; font-weight: 800; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; }
  .of { font-size: 15px; font-weight: 600; color: var(--on-hour-2); font-variant-numeric: tabular-nums; }
  .bar { position: relative; display: flex; height: 14px; margin: 10px 0 8px; border-radius: 7px; background: var(--veil-2); }
  .bar i { display: block; height: 100%; transition: width 0.5s var(--ease-out); }
  .p { background: var(--on-hour); border-radius: 7px 0 0 7px; }
  .x { background: var(--hatch); border-radius: 0 7px 7px 0; }
  .tick { position: absolute; top: -5px; bottom: -5px; width: 3px; margin-left: -2px; border-radius: 2px; background: var(--on-hour); height: auto !important; }
  .leg { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; font-weight: 650; color: var(--on-hour-2); }
  .sw { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px; border-radius: 4px; background: var(--on-hour); }
  .sw.h { background: var(--hatch); }
</style>
