<script lang="ts">
  import PlanEditor from './plan/PlanEditor.svelte';
  import Catalogo from './plan/Catalogo.svelte';
  import BackupScreen from './plan/BackupScreen.svelte';

  let { path }: { path: string[] } = $props();
</script>

{#if path[0] === 'alimenti'}
  <Catalogo />
{:else if path[0] === 'backup'}
  <BackupScreen />
{:else}
  <PlanEditor />
{/if}
