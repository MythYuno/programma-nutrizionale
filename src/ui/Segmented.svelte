<script lang="ts" generics="T extends string">
  let { value = $bindable(), options }: { value: T; options: { value: T; label: string }[] } = $props();
</script>

<div class="seg" role="tablist">
  {#each options as o (o.value)}
    <button role="tab" aria-selected={value === o.value} class:on={value === o.value} onclick={() => (value = o.value)}>{o.label}</button>
  {/each}
</div>

<style>
  .seg { display: flex; background: var(--fill); border-radius: 9px; padding: 2px; margin: 4px 0 14px; }
  button { flex: 1; border: 0; background: none; border-radius: 7px; padding: 6px 4px; font-size: 13px; font-weight: 500; transition: background 0.15s; }
  .on { background: var(--seg-on); font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12); }
</style>
