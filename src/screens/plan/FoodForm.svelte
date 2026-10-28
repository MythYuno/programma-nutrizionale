<script lang="ts">
  import { untrack } from 'svelte';
  import type { Food } from '../../domain/types';
  import { app } from '../../state/app.svelte';
  import { mealsUsingFood } from '../../db/repos';
  import { DAY_NAMES } from '../../domain/validate';
  import { SLOT_LABEL } from '../../domain/types';
  import { editor } from '../../state/editor.svelte';

  let { food = null, initialName = '', onSaved, onCancel }: {
    food?: Food | null;
    initialName?: string;
    onSaved: (f: Food) => void;
    onCancel: () => void;
  } = $props();

  const categories = $derived([...new Set(app.foods.map((f) => f.category))].sort((a, b) => a.localeCompare(b, 'it')));

  // Il modulo parte dai valori iniziali: chi lo apre lo ricrea con {#key}.
  const init = untrack(() => ({ food, initialName }));
  let name = $state(init.food?.name ?? init.initialName);
  let category = $state(init.food?.category ?? 'Altro');
  let kcal = $state(init.food ? String(init.food.per100.kcal) : '');
  let p = $state(init.food ? String(init.food.per100.p) : '');
  let c = $state(init.food ? String(init.food.per100.c) : '');
  let f = $state(init.food ? String(init.food.per100.f) : '');
  let error = $state('');

  const num = (s: string) => Number(String(s).replace(',', '.'));
  const usedIn = $derived(food ? mealsUsingFood([...(app.plan ? [app.plan] : []), ...(editor.draft ? [editor.draft] : [])], food.id) : []);

  function slugify(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function save() {
    const vals = [kcal, p, c, f].map(num);
    if (!name.trim()) { error = 'Il nome è obbligatorio.'; return; }
    if (vals.some((v) => !Number.isFinite(v) || v < 0)) { error = 'Valori per 100 g non validi.'; return; }
    if (vals[1]! + vals[2]! + vals[3]! > 100) { error = 'Proteine, carboidrati e grassi superano 100 g su 100 g.'; return; }
    const id = food?.id ?? `${slugify(name)}-${Date.now().toString(36)}`;
    const per100 = { kcal: vals[0]!, p: vals[1]!, c: vals[2]!, f: vals[3]! };
    // Se cambi i valori di un alimento delle tabelle, diventa un dato tuo.
    const changed = !food || JSON.stringify(food.per100) !== JSON.stringify(per100);
    const saved: Food = { id, name: name.trim(), category: category.trim() || 'Altro', source: changed ? 'manuale' : food!.source, per100 };
    await app.saveFood(saved);
    onSaved(saved);
  }

  async function remove() {
    if (!food || usedIn.length) return;
    await app.deleteFood(food.id);
    onCancel();
  }
</script>

<div class="group">
  <label class="row"><span class="lab">Nome</span><input class="grow in" bind:value={name} placeholder="es. Seppia" /></label>
  <label class="row"><span class="lab">Categoria</span><input class="grow in" list="cats" bind:value={category} /></label>
</div>
<datalist id="cats">{#each categories as c (c)}<option value={c}></option>{/each}</datalist>

<h3 class="section-title">Valori per 100 g</h3>
<div class="group">
  <label class="row"><span class="grow">Calorie</span><input class="n num" inputmode="decimal" bind:value={kcal} /><span class="u">kcal</span></label>
  <label class="row"><span class="grow">Proteine</span><input class="n num" inputmode="decimal" bind:value={p} /><span class="u">g</span></label>
  <label class="row"><span class="grow">Carboidrati</span><input class="n num" inputmode="decimal" bind:value={c} /><span class="u">g</span></label>
  <label class="row"><span class="grow">Grassi</span><input class="n num" inputmode="decimal" bind:value={f} /><span class="u">g</span></label>
</div>
<p class="section-foot">
  {#if food?.source === 'tabelle'}Stima da tabelle pubbliche (CREA e equivalenti).{:else if food?.source === 'etichetta'}Media da etichette di prodotti confezionati.{:else}Prendi i valori dall'etichetta o dalla banca dati CREA.{/if}
</p>

{#if error}<p class="err">{error}</p>{/if}
<button class="btn" onclick={save}>Salva</button>
<button class="btn plain" onclick={onCancel}>Annulla</button>

{#if food}
  {#if usedIn.length}
    <p class="section-foot">Non si può eliminare: è usato in {usedIn.slice(0, 3).map((u) => `${DAY_NAMES[u.day]} (${SLOT_LABEL[u.slot].toLowerCase()})`).join(', ')}{usedIn.length > 3 ? ` e altri ${usedIn.length - 3}` : ''}.</p>
  {:else}
    <button class="btn danger" onclick={remove}>Elimina alimento</button>
  {/if}
{/if}

<style>
  .lab { width: 92px; color: var(--text-2); }
  .in { border: 0; background: none; outline: none; font-size: 17px; }
  .n { width: 80px; border: 0; background: var(--fill); border-radius: 8px; padding: 6px 8px; text-align: right; outline: none; font-size: 17px; }
  .u { width: 32px; color: var(--text-2); }
  .err { color: var(--red); font-size: 15px; }
</style>
