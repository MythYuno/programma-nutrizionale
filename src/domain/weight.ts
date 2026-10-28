import type { Weight } from './types';
import { addDays } from './schedule';

export function sortByDate(ws: readonly Weight[]): Weight[] {
  return [...ws].sort((a, b) => a.date.localeCompare(b.date));
}

// Media delle pesate negli ultimi `days` giorni di calendario fino a `date`
// compresa. Con pesate saltuarie usa quelle che ci sono.
export function trailingAverage(ws: readonly Weight[], date: string, days = 7): number | null {
  const from = addDays(date, -(days - 1));
  const win = ws.filter((w) => w.date >= from && w.date <= date);
  if (!win.length) return null;
  return win.reduce((s, w) => s + w.kg, 0) / win.length;
}

export interface TrendPoint {
  date: string;
  kg: number;
  avg: number;
}

export function trend(ws: readonly Weight[], days = 7): TrendPoint[] {
  return sortByDate(ws).map((w) => ({ date: w.date, kg: w.kg, avg: trailingAverage(ws, w.date, days)! }));
}

// Variazione della media rispetto a 7 giorni prima. Null se manca uno dei due.
export function weeklyChange(ws: readonly Weight[], date: string): number | null {
  const now = trailingAverage(ws, date);
  const before = trailingAverage(ws, addDays(date, -7));
  return now === null || before === null ? null : now - before;
}

export type Range = '1M' | '3M' | '1A' | 'Tutto';

export function inRange(ws: readonly Weight[], range: Range, today: string): Weight[] {
  if (range === 'Tutto') return sortByDate(ws);
  const back = { '1M': 30, '3M': 91, '1A': 365 }[range];
  const from = addDays(today, -back);
  return sortByDate(ws.filter((w) => w.date >= from));
}

export function upsertWeight(ws: readonly Weight[], w: Weight): Weight[] {
  return sortByDate([...ws.filter((x) => x.date !== w.date), w]);
}

export function parseKg(input: string): number | null {
  const n = Number(input.replace(',', '.').trim());
  return Number.isFinite(n) && n >= 20 && n <= 400 ? Math.round(n * 10) / 10 : null;
}

export function fmtKg(kg: number): string {
  return kg.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
