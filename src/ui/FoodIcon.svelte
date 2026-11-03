<script lang="ts">
  import type { FoodIconName } from '../domain/types';

  // Icone 3D Fluent Emoji (Microsoft, MIT) in public/emoji/: solo decorative.
  let { name, size = 32 }: { name: FoodIconName; size?: number } = $props();
</script>

<img src="{import.meta.env.BASE_URL}emoji/{name}.png" alt="" width={size} height={size} loading="lazy" decoding="async" />

<style>
  img { display: block; flex: none; object-fit: contain; }
</style>
