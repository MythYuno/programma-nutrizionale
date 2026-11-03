<script lang="ts">
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
  import Toast from '../../ui/Toast.svelte';
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
  let added = $state<ExtraLog | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const title = $derived(freeSlot ? `Pasto libero · ${SLOT_LABEL[freeSlot]}` : 'Ho mangiato altro');
  const results = $derived(searchExtras(query, EXTRAS_CATALOG, extrasState.customItems, app.foods));
  const recents = $derived(recentItems(extrasState.extras, extrasState.customItems, EXTRAS_CATALOG, app.foodIndex));
  const list = $derived<ExtraChoice[]>(cat === 'Le mie'
    ? extrasState.customItems.map((item) => ({ kind: 'mia', item }))
    : EXTRAS_CATALOG.filter((x) => x.category === cat).map((item) => ({ kind: 'catalogo', item })));

  // Ogni volta che il foglio si chiude riparte pulito.
  $effect(() => {
    if (!open) { query = ''; manualName = null; pickedFood = null; }
  });

  async function pick(choice: ExtraChoice) {
    if (choice.kind === 'alimento') { pickedFood = choice.item; return; }
    showToast(await extrasState.add(choice, date, { freeSlot }));
  }

  function showToast(e: ExtraLog) {
    added = e;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (added = null), 5000);
  }

  // Annulla: una voce ripetuta torna indietro di uno, altrimenti sparisce.
  async function undo() {
    if (!added) return;
    const current = extrasState.extras.find((x) => x.id === added!.id);
    if (current && current.qty > 1) await extrasState.setQty(current.id, current.qty - 1);
    else await extrasState.remove(added.id);
    added = null;
  }

  const iconOf = (r: ExtraChoice) => (r.kind === 'catalogo' ? r.item.icon : r.kind === 'mia' ? 'bookmark' : 'plate');
</script>

<Sheet bind:open {title}>
  {#if manualName !== null}
    <ExtraForm initialName={manualName} {date} {freeSlot} onDone={() => (open = false)} />
  {:else if pickedFood}
    <FoodGramsForm food={pickedFood} {date} {freeSlot} onDone={() => (open = false)} />
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
        {#each list as r (r.item.id)}<ChoiceRow choice={r} onAdd={() => pick(r)} />{:else}<p class="empty muted">Le voci che salvi a mano compaiono qui.</p>{/each}
      </div>
    {/if}
    <p class="section-foot">Valori stimati per porzioni tipiche: indicativi, non del medico.</p>
  {/if}
</Sheet>

<Toast message={added ? `${added.name} aggiunto · ${fmtNumber(added.macro.kcal)} kcal` : null} action="Annulla" onAction={undo} />

<style>
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
