<script lang="ts">
  import Plus from 'phosphor-svelte/lib/Plus';
  import type { ExtraChoice } from '../../domain/extras';
  import type { FoodIconName } from '../../domain/types';
  import { fmtDecimal, fmtNumber } from '../../domain/nutrition';
  import FoodIcon from '../../ui/FoodIcon.svelte';

  // Una voce scelta da catalogo, voci tue o alimenti. Il "+" aggiunge subito;
  // per un alimento apre i grammi (lo decide chi usa la riga).
  let { choice, onAdd }: { choice: ExtraChoice; onAdd: () => void } = $props();

  const icon = $derived<FoodIconName>(choice.kind === 'catalogo' ? choice.item.icon : choice.kind === 'mia' ? 'bookmark' : 'plate');
  const tag = $derived(choice.kind === 'mia' ? 'tua' : choice.kind === 'alimento' ? 'alimento' : '');
  const detail = $derived.by(() => {
    if (choice.kind === 'alimento') return `per grammi · ${fmtNumber(choice.item.per100.kcal)} kcal/100 g`;
    const { kcal, p, c, f } = choice.item.macro;
    const macros = [['P', p], ['C', c], ['G', f]].filter(([, v]) => (v as number) > 0).map(([k, v]) => `${k} ${fmtDecimal(v as number)}`);
    return [choice.item.portion, `${fmtNumber(kcal)} kcal`, ...macros].filter(Boolean).join(' · ');
  });
</script>

<div class="li">
  <FoodIcon name={icon} size={32} />
  <span class="g">
    <span class="t">{choice.item.name}{#if tag}<span class="src">{tag}</span>{/if}</span>
    <span class="s num">{detail}</span>
  </span>
  <button class="add" aria-label="Aggiungi {choice.item.name}" onclick={onAdd}><Plus size={18} weight="bold" /></button>
</div>

<style>
  .li { display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 14px; border-top: 1px solid var(--sep); }
  .li:first-child { border-top: 0; }
  .g { flex: 1; min-width: 0; }
  .t { display: block; font-size: 16px; font-weight: 600; }
  .s { display: block; font-size: 13px; color: var(--ink-2); font-weight: 550; margin-top: 1px; }
  .src { margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: var(--fill); color: var(--ink-2); font-size: 11px; font-weight: 750; vertical-align: 1px; }
  .add {
    flex: none; width: 36px; height: 36px; border: 0; border-radius: 50%; display: grid; place-items: center;
    background: color-mix(in srgb, var(--act) 12%, transparent); color: var(--act);
  }
  .add:active { transform: scale(0.92); }
</style>
