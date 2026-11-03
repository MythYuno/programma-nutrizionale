<script lang="ts">
  import { untrack } from 'svelte';
  import { extrasState } from '../../state/extras.svelte';
  import { kcalFromMacros, parseAmount, validateExtra } from '../../domain/extras';
  import type { Slot } from '../../domain/types';

  // Voce scritta a mano, per esempio dall'etichetta. Le kcal si calcolano dai
  // macro finché non le scrivi tu: da quel momento restano le tue.
  let { initialName, date, freeSlot, onDone }: {
    initialName: string;
    date: string;
    freeSlot: Slot | null;
    onDone: () => void;
  } = $props();

  let name = $state(untrack(() => initialName));
  let portion = $state('');
  let p = $state('');
  let c = $state('');
  let f = $state('');
  let kcalTyped = $state<string | null>(null);
  let save = $state(true);
  let errors = $state<ReturnType<typeof validateExtra>>({});

  const num = (s: string) => parseAmount(s) ?? 0;
  const auto = $derived(kcalFromMacros(num(p), num(c), num(f)));
  const kcalText = $derived(kcalTyped ?? (p || c || f ? String(auto) : ''));

  async function submit() {
    const macro = { kcal: parseAmount(kcalText) ?? NaN, p: num(p), c: num(c), f: num(f) };
    errors = validateExtra({ name, macro, grams: null, origin: 'manuale' });
    if (Object.keys(errors).length) return;
    await extrasState.addManual({ name, portion, macro }, date, { freeSlot, save });
    onDone();
  }
</script>

<div class="group">
  <label class="row"><span class="lab">Nome</span><input class="grow in" bind:value={name} autocomplete="off" /></label>
  <label class="row"><span class="lab">Porzione</span><input class="grow in" bind:value={portion} placeholder="Facoltativa, es. 1 barretta…" autocomplete="off" /></label>
</div>
{#if errors.name}<p class="err">{errors.name}</p>{/if}

<div class="macro">
  <label class="m"><span>Proteine</span><input inputmode="decimal" bind:value={p} placeholder="0" aria-label="Proteine" autocomplete="off" /><i>g</i></label>
  <label class="m"><span>Carboidrati</span><input inputmode="decimal" bind:value={c} placeholder="0" aria-label="Carboidrati" autocomplete="off" /><i>g</i></label>
  <label class="m"><span>Grassi</span><input inputmode="decimal" bind:value={f} placeholder="0" aria-label="Grassi" autocomplete="off" /><i>g</i></label>
</div>
{#if errors.macro}<p class="err">{errors.macro}</p>{/if}

<label class="kcal">
  <input inputmode="decimal" value={kcalText} oninput={(e) => (kcalTyped = e.currentTarget.value)} placeholder="0" aria-label="kcal" autocomplete="off" />
  <span class="u">kcal</span>
  <small>{kcalTyped === null ? 'calcolate dai macro, puoi correggerle' : 'scritte da te'}</small>
</label>
{#if errors.kcal}<p class="err">{errors.kcal}</p>{/if}

<label class="tog">
  <span>Salva tra le mie voci</span>
  <input type="checkbox" role="switch" bind:checked={save} />
</label>

<button class="btn add" onclick={submit}>{freeSlot ? 'Aggiungi a questo pasto' : 'Aggiungi a oggi'}</button>

<style>
  .lab { width: 92px; color: var(--ink-2); }
  .in { border: 0; background: none; outline: none; font-size: 17px; color: var(--ink); min-width: 0; }
  .macro { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
  .m { display: grid; grid-template-columns: 1fr auto; align-items: baseline; padding: 10px 12px; border-radius: 14px; background: var(--card); box-shadow: 0 0 0 1px var(--sep); }
  .m span { grid-column: 1 / -1; font-size: 12px; font-weight: 650; color: var(--ink-2); }
  .m input { width: 100%; min-width: 0; border: 0; background: none; outline: none; font-size: 20px; font-weight: 780; color: var(--ink); }
  .m i { font-style: normal; font-size: 13px; font-weight: 650; color: var(--ink-2); }
  .m:focus-within, .kcal:focus-within { box-shadow: 0 0 0 2px var(--act); }
  .kcal { display: grid; grid-template-columns: auto 1fr; align-items: baseline; column-gap: 8px; margin-top: 10px; padding: 12px 16px; border-radius: 18px; background: var(--card); box-shadow: 0 0 0 1px var(--sep); }
  .kcal input { width: 4.4ch; border: 0; background: none; outline: none; font-size: 34px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); font-variant-numeric: tabular-nums; }
  .u { font-size: 16px; font-weight: 700; color: var(--ink-2); }
  .kcal small { grid-column: 1 / -1; font-size: 13px; color: var(--ink-2); font-weight: 600; }
  .tog { display: flex; justify-content: space-between; align-items: center; margin: 16px 4px 0; font-size: 15px; font-weight: 600; }
  /* Interruttore in stile iOS, sopra una checkbox vera. */
  .tog input { appearance: none; position: relative; flex: none; width: 51px; height: 31px; margin: 0; border-radius: 16px; background: var(--fill); transition: background-color 0.2s var(--ease-out); }
  .tog input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); transition: transform 0.2s var(--ease-out); }
  .tog input:checked { background: var(--act); }
  .tog input:checked::after { transform: translateX(20px); }
  .add { margin-top: 16px; }
  .err { color: var(--danger); font-size: 14px; margin: 6px 4px 0; }
</style>
