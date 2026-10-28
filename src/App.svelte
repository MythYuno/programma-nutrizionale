<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './state/app.svelte';
  import { router } from './state/router.svelte';
  import TabBar from './ui/TabBar.svelte';
  import DayView from './screens/DayView.svelte';
  import Settimana from './screens/Settimana.svelte';
  import Peso from './screens/Peso.svelte';
  import Piano from './screens/Piano.svelte';

  onMount(() => {
    app.load();
    // Se l'app resta aperta oltre la mezzanotte, "Oggi" deve cambiare giorno.
    const onVisible = () => document.visibilityState === 'visible' && app.refreshToday();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  const p = $derived(router.parts);
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
