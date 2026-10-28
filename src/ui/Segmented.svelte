<script lang="ts" generics="T extends string">
  let { value = $bindable(), options, ground = false }: {
    value: T;
    options: { value: T; label: string }[];
    ground?: boolean;
  } = $props();
</script>

<div class="seg" class:ground role="tablist">
  {#each options as o (o.value)}
    <button role="tab" aria-selected={value === o.value} class:on={value === o.value} onclick={() => (value = o.value)}>{o.label}</button>
  {/each}
</div>

<style>
  .seg { display: flex; background: var(--fill); border-radius: 12px; padding: 3px; margin: 4px 0 14px; }
  button { flex: 1; border: 0; background: none; border-radius: 9px; padding: 7px 4px; font-size: 14px; font-weight: 600; color: var(--ink-2); transition: background-color 0.2s var(--ease-out), color 0.2s; }
  .on { background: var(--card); color: var(--ink); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14); }
  /* Variante sul fondo colorato, fuori dalle schede */
  .ground { background: var(--veil); }
  .ground button { color: var(--on-hour-2); }
  .ground .on { background: var(--card); color: var(--act); }
</style>
