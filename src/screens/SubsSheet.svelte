<script lang="ts">
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import type { PlanItem } from '../domain/types';
  import { fmtGrams } from '../domain/nutrition';
  import { ALTERNATIVE_SOURCES, alternativesFor } from '../domain/substitutions';
  import { app } from '../state/app.svelte';

  let { item = $bindable(null) }: { item: PlanItem | null } = $props();

  let open = $state(false);
  let tab = $state<'medico' | 'alt'>('medico');
  let last = $state<PlanItem | null>(null);

  $effect(() => {
    if (item) {
      last = item;
      tab = item.subs.length ? 'medico' : 'alt';
      open = true;
    }
  });
  $effect(() => {
    if (!open) item = null;
  });

  const name = (id: string) => app.foodIndex.get(id)?.name ?? 'Alimento sconosciuto';
  const alts = $derived(last ? alternativesFor(name(last.foodId), last.grams) : []);
</script>

<Sheet bind:open title={last ? `Al posto di ${fmtGrams(last.grams)} di ${name(last.foodId).toLowerCase()}` : ''}>
  {#if last}
    <Segmented bind:value={tab} options={[{ value: 'medico', label: 'Dott. Occhino' }, { value: 'alt', label: 'Alternative' }]} />

    {#if tab === 'medico'}
      {#if last.subs.length}
        <div class="group">
          {#each last.subs as s, i (i)}
            <div class="row"><span class="grow">{name(s.foodId)}</span><b class="num">{fmtGrams(s.grams)}</b></div>
          {/each}
        </div>
        <p class="section-foot">Scambi scritti nel piano: mantengono i macro previsti. Sono la fonte da seguire.</p>
      {:else}
        <p class="muted empty">Il piano non prevede scambi per questo alimento. Guarda le alternative indicative.</p>
      {/if}
    {:else if alts.length}
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
    {:else}
      <p class="muted empty">Nessuna alternativa indicativa per questo alimento.</p>
    {/if}
  {/if}
</Sheet>

<style>
  .empty { padding: 16px; text-align: center; }
  a { color: var(--act); }
</style>
