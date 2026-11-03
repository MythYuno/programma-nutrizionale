<script lang="ts">
  import { untrack } from 'svelte';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import PencilSimple from 'phosphor-svelte/lib/PencilSimple';
  import { app } from '../../state/app.svelte';
  import { extrasState } from '../../state/extras.svelte';
  import { EXTRAS_CATALOG } from '../../domain/extras-catalog';
  import { recentItems, searchExtras, type ExtraChoice } from '../../domain/extras';
  import { fmtNumber } from '../../domain/nutrition';
  import type { ExtraCategory, ExtraLog, Food, Slot } from '../../domain/types';
  import { SLOT_LABEL } from '../../domain/types';
  import Sheet from '../../ui/Sheet.svelte';
  import { toast } from '../../state/toast.svelte';
  import FoodIcon from '../../ui/FoodIcon.svelte';
  import ChoiceRow from './ChoiceRow.svelte';
  import ExtraForm from './ExtraForm.svelte';
  import FoodGramsForm from './FoodGramsForm.svelte';

  // Un'unica ricerca su voci tue, sgarri del catalogo e alimenti dell'app.
  let { open = $bindable(false), date, freeSlot }: { open: boolean; date: string; freeSlot: Slot | null } = $props();

  type Cat = ExtraCategory | 'Le mie';
  const CATS: Cat[] = ['Dolci', 'Alcolici', 'Salato', 'Le mie'];

  let query = $state('');
  let cat = $state<Cat>('Dolci');
  let manualName = $state<string | null>(null); // modulo "a mano"
  let pickedFood = $state<Food | null>(null); // modulo grammi

  const title = $derived(freeSlot ? `Pasto libero · ${SLOT_LABEL[freeSlot]}` : 'Ho mangiato altro');
  const results = $derived(searchExtras(query, EXTRAS_CATALOG, extrasState.customItems, app.foods));
  // I recenti si fissano all'apertura: se cambiassero mentre aggiungi, l'elenco
  // sotto il dito si sposterebbe e il tocco dopo cadrebbe sulla voce sbagliata.
  let recents = $state<ExtraChoice[]>([]);
  const list = $derived<ExtraChoice[]>(cat === 'Le mie'
    ? extrasState.customItems.map((item) => ({ kind: 'mia', item }))
    : EXTRAS_CATALOG.filter((x) => x.category === cat).map((item) => ({ kind: 'catalogo', item })));

  // All'apertura si fissano i recenti; alla chiusura il foglio riparte pulito.
  $effect(() => {
    if (open) recents = untrack(() => recentItems(extrasState.extras, extrasState.customItems, EXTRAS_CATALOG, app.foodIndex));
    else { query = ''; manualName = null; pickedFood = null; }
  });

  async function pick(choice: ExtraChoice) {
    if (choice.kind === 'alimento') { pickedFood = choice.item; return; }
    showToast(await extrasState.add(choice, date, { freeSlot }));
  }

  // "… aggiunto" con Annulla: una voce ripetuta torna indietro di uno,
  // altrimenti sparisce.
  function showToast(e: ExtraLog) {
    toast.show(`${e.name} aggiunto · ${fmtNumber(e.macro.kcal)} kcal`, {
      label: 'Annulla',
      run: async () => {
        const current = extrasState.extras.find((x) => x.id === e.id);
        if (current && current.qty > 1) await extrasState.setQty(current.id, current.qty - 1);
        else await extrasState.remove(e.id);
      },
    });
  }

  function done(e: ExtraLog) {
    open = false;
    showToast(e);
  }

  const iconOf = (r: ExtraChoice) => (r.kind === 'catalogo' ? r.item.icon : r.kind === 'mia' ? 'bookmark' : 'plate');
</script>

<Sheet bind:open {title}>
  <div class="content">
    {#if manualName !== null}
      <ExtraForm initialName={manualName} {date} {freeSlot} onDone={done} />
    {:else if pickedFood}
      <FoodGramsForm food={pickedFood} {date} {freeSlot} onDone={done} />
    {:else}
      <label class="search">
        <MagnifyingGlass size={20} />
        <input bind:value={query} placeholder="Cerca o scrivi cosa hai mangiato…" aria-label="Cerca o scrivi cosa hai mangiato" autocomplete="off" />
      </label>
  
      {#if query.trim()}
        <div class="group results">
          {#each results as r (r.kind + r.item.id)}<ChoiceRow choice={r} onAdd={() => pick(r)} />{/each}
          <button class="manual" aria-label="Aggiungi «{query.trim()}» a mano" onclick={() => (manualName = query.trim())}>
            <span class="pen"><PencilSimple size={18} weight="bold" /></span>
            <span><b>Aggiungi «{query.trim()}» a mano</b><small>Nome, kcal e macro come sull’etichetta</small></span>
          </button>
        </div>
      {:else}
        {#if recents.length}
          <h3 class="lab">Recenti</h3>
          <div class="recent">
            {#each recents as r (r.kind + r.item.id)}
              <button class="rc" aria-label="{r.item.name}, recente: aggiungi" onclick={() => pick(r)}>
                <FoodIcon name={iconOf(r)} size={30} />
                <b>{r.item.name}</b>
                <small class="num">{r.kind === 'alimento' ? 'per grammi' : `${fmtNumber(r.item.macro.kcal)} kcal`}</small>
              </button>
            {/each}
          </div>
        {/if}
        <h3 class="lab">Sgarri comuni</h3>
        <div class="cats">
          {#each CATS as c (c)}<button class="cat" aria-pressed={cat === c} onclick={() => (cat = c)}>{c}</button>{/each}
        </div>
        <div class="group">
          {#each list as r (r.item.id)}<ChoiceRow choice={r} onAdd={() => pick(r)} onDelete={r.kind === 'mia' ? () => extrasState.deleteCustom(r.item.id) : undefined} />{:else}<p class="empty muted">Le voci che salvi a mano compaiono qui.</p>{/each}
        </div>
      {/if}
      <p class="section-foot">Valori stimati per porzioni tipiche: indicativi, non del medico.</p>
    {/if}
  </div>
</Sheet>

<style>
  /* Altezza fissa: il foglio non si accorcia e allunga mentre scrivi. */
  .content { min-height: 62vh; }
  .search { display: flex; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 4px; border-radius: 14px; background: var(--card); color: var(--ink-3); box-shadow: 0 0 0 1px var(--sep); }
  .search:focus-within { box-shadow: 0 0 0 2px var(--act); }
  .search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; font-size: 17px; color: var(--ink); }
  .lab { font-size: 14px; font-weight: 650; color: var(--ink-2); margin: 18px 4px 8px; }
  .recent { display: flex; gap: 8px; overflow-x: auto; margin: 0 -16px; padding: 2px 16px 4px; scrollbar-width: none; }
  .rc { flex: none; width: 118px; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px 12px; border: 0; border-radius: 16px; background: var(--card); color: var(--ink); text-align: left; box-shadow: 0 0 0 1px var(--sep); }
  .rc b { font-size: 14px; font-weight: 650; line-height: 1.2; min-height: 34px; }
  .rc small { font-size: 13px; color: var(--ink-2); font-weight: 600; }
  .cats { display: flex; gap: 6px; margin-bottom: 12px; }
  .cat { padding: 8px 13px; border: 0; border-radius: 999px; background: var(--card); color: var(--ink); font-size: 14px; font-weight: 650; box-shadow: 0 0 0 1px var(--sep); }
  .cat[aria-pressed='true'] { background: var(--ink); color: var(--card); box-shadow: none; }
  .results { margin-top: 12px; }
  .manual { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 0; border-top: 1px solid var(--sep); background: none; color: var(--act); text-align: left; }
  .manual b { display: block; font-size: 16px; font-weight: 650; }
  .manual small { display: block; font-size: 13px; color: var(--ink-2); font-weight: 550; }
  .pen { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--act); color: var(--on-act); }
  .empty { padding: 16px; text-align: center; font-size: 15px; }
</style>
