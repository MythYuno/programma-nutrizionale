<script lang="ts">
  import type { TrendPoint } from '../domain/weight';
  import { fmtKg } from '../domain/weight';
  import { parseDate } from '../domain/schedule';
  import { dayMonth } from '../ui/format';

  let { points, goal }: { points: TrendPoint[]; goal: number | null } = $props();

  const W = 320, H = 160, PAD = { l: 34, r: 8, t: 10, b: 22 };

  const geo = $derived.by(() => {
    const t = points.map((p) => parseDate(p.date).getTime());
    const t0 = Math.min(...t), t1 = Math.max(...t);
    const vals = points.flatMap((p) => [p.kg, p.avg]).concat(goal ?? []);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 2) { const m = (hi + lo) / 2; lo = m - 1; hi = m + 1; }
    lo = Math.floor(lo - 0.3); hi = Math.ceil(hi + 0.3);
    const x = (ms: number) => PAD.l + (t1 === t0 ? (W - PAD.l - PAD.r) / 2 : ((ms - t0) / (t1 - t0)) * (W - PAD.l - PAD.r));
    const y = (kg: number) => PAD.t + (1 - (kg - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const ticks = [lo, (lo + hi) / 2, hi];
    return { x, y, ticks, t };
  });

  const raw = $derived(points.map((p, i) => ({ cx: geo.x(geo.t[i]!), cy: geo.y(p.kg) })));
  const avgPath = $derived(points.map((p, i) => `${i ? 'L' : 'M'}${geo.x(geo.t[i]!).toFixed(1)},${geo.y(p.avg).toFixed(1)}`).join(' '));
</script>

<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Andamento del peso">
  {#each geo.ticks as k (k)}
    <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(k)} y2={geo.y(k)} stroke="var(--sep)" stroke-width="0.5" />
    <text x={PAD.l - 6} y={geo.y(k)} text-anchor="end" dominant-baseline="central" font-size="10" fill="var(--text-2)">{fmtKg(k)}</text>
  {/each}
  {#if goal !== null}
    <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(goal)} y2={geo.y(goal)} stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4 4" />
  {/if}
  {#each raw as d, i (i)}<circle cx={d.cx} cy={d.cy} r="2.5" fill="var(--text-3)" />{/each}
  <path d={avgPath} fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
  {#if points.length}
    <text x={PAD.l} y={H - 4} font-size="10" fill="var(--text-2)">{dayMonth(points[0]!.date)}</text>
    <text x={W - PAD.r} y={H - 4} font-size="10" fill="var(--text-2)" text-anchor="end">{dayMonth(points[points.length - 1]!.date)}</text>
  {/if}
</svg>
