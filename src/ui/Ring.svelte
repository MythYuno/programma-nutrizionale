<script lang="ts">
  let { value, label, size = 72, color = 'var(--pink)' }: { value: number; label: string; size?: number; color?: string } = $props();
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const v = $derived(Math.max(0, Math.min(1, value)));
</script>

<svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label="Avanzamento {label}">
  <circle cx="18" cy="18" {r} fill="none" stroke="var(--fill)" stroke-width="4" />
  <!-- A zero niente arco: il tappo arrotondato disegnerebbe comunque un puntino. -->
  <circle cx="18" cy="18" {r} fill="none" stroke={color} stroke-width="4" stroke-linecap="round" opacity={v > 0 ? 1 : 0}
    stroke-dasharray="{c * v} {c}" transform="rotate(-90 18 18)" style="transition: stroke-dasharray .5s ease" />
  <text x="18" y="18" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="700" fill="var(--text)">{label}</text>
</svg>
