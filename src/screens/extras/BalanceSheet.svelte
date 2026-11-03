<script lang="ts">
  import Sheet from '../../ui/Sheet.svelte';
  import type { DayBalance } from '../../domain/extras';
  import { add } from '../../domain/nutrition';

  // Macro del giorno divisi tra piano, fuori piano (sgarri + pasto libero) e totale.
  let { open = $bindable(false), balance }: { open: boolean; balance: DayBalance } = $props();

  const outside = $derived(add(balance.offPlan, balance.free));
  const rows = $derived([
    { label: 'Proteine', key: 'p' as const },
    { label: 'Carboidrati', key: 'c' as const },
    { label: 'Grassi', key: 'f' as const },
  ]);
</script>

<Sheet bind:open title="Bilancio del giorno">
  <table class="group">
    <thead><tr><th></th><th>Piano</th><th>Fuori piano</th><th>Totale</th></tr></thead>
    <tbody>
      {#each rows as r (r.key)}
        <tr>
          <th scope="row">{r.label}</th>
          <td>{Math.round(balance.fromPlan[r.key])} g</td>
          <td>{Math.round(outside[r.key])} g</td>
          <td><b>{Math.round(balance.total[r.key])} g</b></td>
        </tr>
      {/each}
      <tr>
        <th scope="row">kcal</th>
        <td>{Math.round(balance.fromPlan.kcal)}</td>
        <td>{Math.round(outside.kcal)}</td>
        <td><b>{Math.round(balance.total.kcal)}</b></td>
      </tr>
    </tbody>
  </table>
  <p class="section-foot">Il piano prevede {Math.round(balance.planned.kcal)} kcal. Valori stimati: indicativi, non i calcoli del medico.</p>
</Sheet>

<style>
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 15px; }
  th, td { padding: 12px 10px; text-align: right; }
  th:first-child { text-align: left; font-weight: 600; }
  thead th { font-size: 13px; font-weight: 650; color: var(--ink-2); }
  tbody tr { border-top: 1px solid var(--sep); }
</style>
