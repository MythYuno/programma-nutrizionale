<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './state/app.svelte';
  import { router } from './state/router.svelte';
  import TabBar from './ui/TabBar.svelte';
  import DayView from './screens/DayView.svelte';
  import Settimana from './screens/Settimana.svelte';
  import Peso from './screens/Peso.svelte';
  import Piano from './screens/Piano.svelte';
  import { nextMeal, weekdayIndex } from './domain/schedule';
  import type { Slot } from './domain/types';

  onMount(() => {
    app.load();
    // Se l'app resta aperta oltre la mezzanotte, "Oggi" deve cambiare giorno.
    const onVisible = () => document.visibilityState === 'visible' && app.refreshToday();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  const p = $derived(router.parts);

  // Il fondo dell'app ha il colore del pasto di adesso; a giornata finita resta quello della cena.
  const hour = $derived.by<Slot>(() => {
    const day = app.plan?.days[weekdayIndex(app.today)];
    return nextMeal(day, app.done(app.today))?.slot ?? 'cena';
  });

  $effect(() => {
    document.documentElement.dataset.hour = hour;
    const meta = document.querySelector('meta[name="theme-color"]');
    // Il colore si legge dopo il cambio di attributo e di nuovo se il sistema passa al tema scuro.
    const sync = () => meta?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--hour').trim());
    sync();
    const dark = matchMedia('(prefers-color-scheme: dark)');
    dark.addEventListener('change', sync);
    return () => dark.removeEventListener('change', sync);
  });
</script>

{#if app.ready}
  {#if p[0] === 'giorno' && p[1]}
    <DayView date={p[1]} />
  {:else if router.tab === 'settimana'}
    <Settimana week={p[1]} />
  {:else if router.tab === 'peso'}
    <Peso />
  {:else if router.tab === 'piano'}
    <Piano path={p.slice(1)} />
  {:else}
    <DayView date={app.today} />
  {/if}
  <TabBar active={router.tab} />
{/if}
