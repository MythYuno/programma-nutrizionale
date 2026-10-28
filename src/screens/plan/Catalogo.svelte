<script lang="ts">
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import Plus from 'phosphor-svelte/lib/Plus';
  import type { Food } from '../../domain/types';
  import { fmtDecimal, fmtNumber } from '../../domain/nutrition';
  import { app } from '../../state/app.svelte';
  import { router } from '../../state/router.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import FoodForm from './FoodForm.svelte';

  let q = $state('');
  let open = $state(false);
  let editing = $state<Food | null>(null);

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const groups = $derived.by(() => {
    const m = new Map<string, Food[]>();
    for (const f of app.foods) {
      if (!norm(f.name).includes(norm(q.trim()))) continue;
      m.set(f.category, [...(m.get(f.category) ?? []), f]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b, 'it')).map(([cat, fs]) => [cat, fs.sort((a, b) => a.name.localeCompare(b.name, 'it'))] as const);
  });

  function edit(f: Food | null) {
    editing = f;
    open = true;
  }
</script>

<main class="screen">
  <button class="back ground-link" onclick={() => router.back('piano')}><CaretLeft size={20} /> Piano</button>
  <div class="top">
    <h1 class="large-title">Alimenti</h1>
    <button class="icon-btn" aria-label="Nuovo alimento" onclick={() => edit(null)}><Plus size={22} weight="bold" /></button>
  </div>

  <label class="search">
    <MagnifyingGlass size={18} />
    <input placeholder="Cerca…" autocomplete="off" bind:value={q} aria-label="Cerca alimento" />
  </label>

  {#each groups as [cat, foods] (cat)}
    <h2 class="section-title">{cat}</h2>
    <div class="group">
      {#each foods as f (f.id)}
        <button class="row" onclick={() => edit(f)}>
          <span class="grow">{f.name}{#if f.source === 'manuale'}<span class="tag">tuo</span>{/if}</span>
          <span class="value small num">{fmtNumber(f.per100.kcal)} kcal · P {fmtDecimal(f.per100.p)} · C {fmtDecimal(f.per100.c)} · G {fmtDecimal(f.per100.f)}</span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="center empty">Nessun alimento trovato.</p>
  {/each}
  <p class="section-foot">Valori per 100 g di parte edibile a crudo. Quelli delle tabelle sono stime indicative: correggili con l'etichetta quando serve.</p>
</main>

<Sheet bind:open title={editing ? editing.name : 'Nuovo alimento'}>
  {#key editing?.id ?? 'new'}
    <FoodForm food={editing} onSaved={() => (open = false)} onCancel={() => (open = false)} />
  {/key}
</Sheet>

<style>
  .back { display: flex; align-items: center; gap: 4px; margin-left: -4px; padding: 0 0 8px; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .empty { color: var(--on-hour-2); }
  .search { display: flex; align-items: center; gap: 8px; background: var(--card); border-radius: 14px; padding: 11px 14px; color: var(--ink-2); box-shadow: var(--shadow-row); }
  .search input { flex: 1; border: 0; background: none; outline: none; font-size: 17px; color: var(--ink); }
  .tag { margin-left: 8px; font-size: 11px; font-weight: 600; color: var(--act); background: var(--fill); padding: 1px 6px; border-radius: 6px; }
  .center { text-align: center; }
</style>
