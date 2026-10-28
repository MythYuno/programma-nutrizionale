<script lang="ts">
  import SunHorizon from 'phosphor-svelte/lib/SunHorizon';
  import CalendarDots from 'phosphor-svelte/lib/CalendarDots';
  import Scales from 'phosphor-svelte/lib/Scales';
  import Notebook from 'phosphor-svelte/lib/Notebook';
  import type { Tab } from '../state/router.svelte';

  let { active }: { active: Tab } = $props();

  const tabs = [
    { id: 'oggi', label: 'Oggi', icon: SunHorizon },
    { id: 'settimana', label: 'Settimana', icon: CalendarDots },
    { id: 'peso', label: 'Peso', icon: Scales },
    { id: 'piano', label: 'Piano', icon: Notebook },
  ] as const;
</script>

<nav aria-label="Sezioni">
  {#each tabs as t (t.id)}
    <a href="#/{t.id}" class:on={active === t.id} aria-current={active === t.id ? 'page' : undefined}>
      <t.icon size={26} weight={active === t.id ? 'fill' : 'regular'} />
      <span>{t.label}</span>
    </a>
  {/each}
</nav>

<style>
  /* La barra è un gradino più profondo del fondo: stesso colore, più scuro. */
  nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
    display: flex; justify-content: space-around;
    padding: 8px 8px calc(env(safe-area-inset-bottom) + 6px);
    background: var(--hour-deep);
    box-shadow: 0 -1px 0 var(--veil);
    transition: background-color 0.7s var(--ease-out);
  }
  a {
    flex: 1; max-width: 120px; display: flex; flex-direction: column; align-items: center; gap: 3px;
    color: color-mix(in srgb, var(--on-hour) 62%, var(--hour-deep));
    text-decoration: none; font-size: 11px; font-weight: 600; padding: 2px 0;
  }
  a.on { color: var(--on-hour); }
</style>
