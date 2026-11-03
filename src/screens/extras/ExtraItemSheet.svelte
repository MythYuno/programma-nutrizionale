<script lang="ts">
  import Minus from 'phosphor-svelte/lib/Minus';
  import Plus from 'phosphor-svelte/lib/Plus';
  import { extrasState } from '../../state/extras.svelte';
  import { extraTotal } from '../../domain/extras';
  import { fmtNumber } from '../../domain/nutrition';
  import type { ExtraLog } from '../../domain/types';
  import Sheet from '../../ui/Sheet.svelte';
  import { toast } from '../../state/toast.svelte';

  // Una voce fuori piano già segnata: quantità ed eliminazione, con Annulla.
  let { open = $bindable(false), extraId }: { open: boolean; extraId: string | null } = $props();

  const current = $derived(extrasState.extras.find((e) => e.id === extraId) ?? null);
  async function remove(e: ExtraLog) {
    open = false;
    const removed = await extrasState.remove(e.id);
    if (removed) toast.show(`${removed.name} eliminato`, { label: 'Annulla', run: () => extrasState.restore(removed) });
  }
</script>

<Sheet bind:open title={current?.name ?? ''}>
  {#if current}
    <div class="qty-row">
      <button class="step" aria-label="Una in meno" disabled={current.qty <= 1} onclick={() => extrasState.setQty(current.id, current.qty - 1)}><Minus size={20} weight="bold" /></button>
      <span class="q num">×{current.qty}<small>{fmtNumber(extraTotal(current).kcal)} kcal</small></span>
      <button class="step" aria-label="Una in più" onclick={() => extrasState.setQty(current.id, current.qty + 1)}><Plus size={20} weight="bold" /></button>
    </div>
    <button class="btn danger" onclick={() => remove(current)}>Elimina</button>
  {/if}
</Sheet>

<style>
  .qty-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 4px 18px; }
  .step { width: 52px; height: 52px; border: 0; border-radius: 50%; display: grid; place-items: center; background: var(--fill); color: var(--act); }
  .step:disabled { opacity: 0.35; }
  .q { display: flex; flex-direction: column; align-items: center; font-size: 34px; font-weight: 800; }
  .q small { font-size: 14px; font-weight: 650; color: var(--ink-2); }
</style>
