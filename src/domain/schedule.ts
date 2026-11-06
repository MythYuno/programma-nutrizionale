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

export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// Da che ora tocca ogni pasto, in minuti dalla mezzanotte. Il piano del medico
// non ha orari: queste fasce sono dell'app e valgono per tutti i giorni.
const SLOT_FROM: Record<Slot, number> = {
  colazione: 0,
  spuntinoMattino: 10 * 60,
  pranzo: 12 * 60,
  spuntinoPomeriggio: 15 * 60 + 30,
  cena: 18 * 60 + 30,
};

export function slotAt(minutes: number): Slot {
  return [...SLOTS].reverse().find((s) => SLOT_FROM[s] <= minutes) ?? 'colazione';
}

// Il pasto "adesso": il primo non fatto a partire dalla fascia dell'ora e
// dall'ultimo pasto segnato, quale dei due viene dopo. Alle 20 senza niente
// segnato è la cena; segnato il pranzo alle 8, è lo spuntino del pomeriggio.
export function nextMeal(day: Day | undefined, done: ReadonlySet<Slot>, minutes: number): Meal | null {
  if (!day) return null;
  const meals = sortMeals(day.meals);
  const last = lastDoneIndex(meals, done);
  const hour = SLOTS.indexOf(slotAt(minutes));
  return meals.find((m, i) => i > last && SLOTS.indexOf(m.slot) >= hour && !done.has(m.slot)) ?? null;
}

// Pasti non segnati che vengono prima della fascia dell'ora o dell'ultimo pasto fatto.
export function skippedMeals(day: Day | undefined, done: ReadonlySet<Slot>, minutes: number): Meal[] {
  if (!day) return [];
  const meals = sortMeals(day.meals);
  const last = lastDoneIndex(meals, done);
  const hour = SLOTS.indexOf(slotAt(minutes));
  return meals.filter((m, i) => !done.has(m.slot) && (i < last || SLOTS.indexOf(m.slot) < hour));
}

function lastDoneIndex(meals: readonly Meal[], done: ReadonlySet<Slot>): number {
  for (let i = meals.length - 1; i >= 0; i--) if (done.has(meals[i]!.slot)) return i;
  return -1;
}
