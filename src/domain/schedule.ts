import type { Day, Meal, MealLog, Slot } from './types';
import { SLOTS } from './types';

// Date come stringhe locali YYYY-MM-DD: il "giorno" è quello dell'orologio
// del telefono, non quello UTC (che a mezzanotte italiana è ancora ieri).
export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

// 0 = lunedì … 6 = domenica
export function weekdayIndex(s: string): number {
  return (parseDate(s).getDay() + 6) % 7;
}

export function mondayOf(s: string): string {
  return addDays(s, -weekdayIndex(s));
}

export function weekDates(s: string): string[] {
  const mon = mondayOf(s);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

export function isoWeek(s: string): string {
  const d = parseDate(s);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const n = Math.ceil(((t.getTime() - y0.getTime()) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(n).padStart(2, '0')}`;
}

export function sortMeals(meals: readonly Meal[]): Meal[] {
  return [...meals].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
}

export function doneSlots(logs: readonly MealLog[], date: string): Set<Slot> {
  return new Set(logs.filter((l) => l.date === date).map((l) => l.slot));
}

// Il pasto "adesso" è il primo non ancora fatto, in ordine di giornata.
// Non si guarda l'ora: se salti lo spuntino, resta lì finché non lo segni.
export function nextMeal(day: Day | undefined, done: ReadonlySet<Slot>): Meal | null {
  if (!day) return null;
  return sortMeals(day.meals).find((m) => !done.has(m.slot)) ?? null;
}
