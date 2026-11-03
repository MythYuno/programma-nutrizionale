// Calcoli per le voci fuori piano e il pasto libero. Tutti i valori sono stime.
import type { CatalogExtra, CustomItem, ExtraLog, ExtraOrigin, Food, FoodIconName, Macro, Meal, MealLog, Slot } from './types';
import { add, fmtDecimal, portionMacro, sumMacro, ZERO, type FoodIndex } from './nutrition';

// Il piano del Dott. Occhino prevede un pasto libero a settimana.
export const FREE_MEALS_PER_WEEK = 1;

const MAX_KCAL = 5000;

// 4 kcal per grammo di proteine e carboidrati, 9 per i grassi.
export function kcalFromMacros(p: number, c: number, f: number): number {
  return Math.round(4 * p + 4 * c + 9 * f);
}

// Numeri scritti a mano: "4,5" e "4.5" valgono uguale.
export function parseAmount(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function extraTotal(e: Pick<ExtraLog, 'macro' | 'qty'>): Macro {
  const { kcal, p, c, f } = e.macro;
  return { kcal: kcal * e.qty, p: p * e.qty, c: c * e.qty, f: f * e.qty };
}

export function sumExtras(list: readonly ExtraLog[]): Macro {
  return list.reduce((acc, e) => add(acc, extraTotal(e)), ZERO);
}

export interface ExtraInput {
  name: string;
  macro: Macro;
  grams: number | null;
  origin: ExtraOrigin;
}

export function validateExtra(input: ExtraInput): Partial<Record<'name' | 'kcal' | 'macro' | 'grams', string>> {
  const errors: Partial<Record<'name' | 'kcal' | 'macro' | 'grams', string>> = {};
  const { kcal, p, c, f } = input.macro;
  if (!input.name.trim()) errors.name = 'Scrivi cosa hai mangiato.';
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > MAX_KCAL) errors.kcal = 'Le kcal devono essere tra 0 e 5000.';
  if ([p, c, f].some((v) => !Number.isFinite(v) || v < 0)) errors.macro = 'Proteine, carboidrati e grassi non possono essere negativi.';
  if (input.origin === 'alimento' && !(input.grams !== null && input.grams > 0)) errors.grams = 'Inserisci i grammi.';
  return errors;
}

// --- Bilancio del giorno e della settimana --------------------------------

export function freeSlots(logs: readonly MealLog[], date: string): Set<Slot> {
  return new Set(logs.filter((l) => l.date === date && l.kind === 'libero').map((l) => l.slot));
}

export interface DayBalance {
  planned: Macro; // tutto il piano del giorno
  fromPlan: Macro; // pasti del piano segnati fatti, esclusi i liberi
  free: Macro; // quello che si è scritto nei pasti liberi
  offPlan: Macro; // sgarri
  total: Macro;
  delta: number; // kcal sopra (+) o sotto (−) il piano
}

// `dayExtras` sono già le voci di quel giorno.
export function dayBalance(
  meals: readonly Meal[], done: ReadonlySet<Slot>, frees: ReadonlySet<Slot>,
  dayExtras: readonly ExtraLog[], foods: FoodIndex,
): DayBalance {
  const planned = sumMacro(meals, foods);
  const fromPlan = sumMacro(meals.filter((m) => done.has(m.slot) && !frees.has(m.slot)), foods);
  // Una voce legata a un pasto che non è (più) libero conta come sgarro: così
  // resta visibile ed eliminabile nella sezione Fuori piano.
  const inFree = (e: ExtraLog) => e.freeSlot !== null && frees.has(e.freeSlot);
  const free = sumExtras(dayExtras.filter(inFree));
  const offPlan = sumExtras(dayExtras.filter((e) => !inFree(e)));
  const total = add(add(fromPlan, free), offPlan);
  return { planned, fromPlan, free, offPlan, total, delta: Math.round(total.kcal) - Math.round(planned.kcal) };
}

export interface WeekSummary {
  offPlanKcal: number;
  freeKcal: number;
  freeMeals: number;
  offPlanDays: number; // giorni con almeno uno sgarro
}

// Conta solo le date passate da chi chiama (in Settimana: fino a oggi).
export function weekSummary(dates: readonly string[], logs: readonly MealLog[], extras: readonly ExtraLog[]): WeekSummary {
  const inWeek = new Set(dates);
  const weekExtras = extras.filter((e) => inWeek.has(e.date));
  const sgarri = weekExtras.filter((e) => e.freeSlot === null);
  return {
    offPlanKcal: Math.round(sumExtras(sgarri).kcal),
    freeKcal: Math.round(sumExtras(weekExtras.filter((e) => e.freeSlot !== null)).kcal),
    freeMeals: logs.filter((l) => l.kind === 'libero' && inWeek.has(l.date)).length,
    offPlanDays: new Set(sgarri.map((e) => e.date)).size,
  };
}

// --- Scelta di una voce: recenti, ricerca, creazione ----------------------

export type ExtraChoice =
  | { kind: 'catalogo'; item: CatalogExtra }
  | { kind: 'mia'; item: CustomItem }
  | { kind: 'alimento'; item: Food };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function choiceFor(e: ExtraLog, customItems: readonly CustomItem[], catalog: readonly CatalogExtra[], foods: FoodIndex): ExtraChoice | null {
  if (e.origin === 'catalogo') { const item = catalog.find((x) => x.id === e.refId); return item ? { kind: 'catalogo', item } : null; }
  if (e.origin === 'mia') { const item = customItems.find((x) => x.id === e.refId); return item ? { kind: 'mia', item } : null; }
  if (e.origin === 'alimento') { const item = e.refId ? foods.get(e.refId) : undefined; return item ? { kind: 'alimento', item } : null; }
  return null;
}

// Voci distinte usate di recente, dalla più recente. Salta le voci scritte al
// volo e quelle che non esistono più (per esempio una voce tua eliminata).
export function recentItems(
  extras: readonly ExtraLog[], customItems: readonly CustomItem[], catalog: readonly CatalogExtra[],
  foods: FoodIndex, limit = 8,
): ExtraChoice[] {
  const seen = new Set<string>();
  const out: ExtraChoice[] = [];
  for (const e of [...extras].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const key = `${e.origin}:${e.refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const c = choiceFor(e, customItems, catalog, foods);
    if (c) out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export function searchExtras(
  query: string, catalog: readonly CatalogExtra[], customItems: readonly CustomItem[], foods: readonly Food[],
): ExtraChoice[] {
  const q = norm(query.trim());
  if (!q) return [];
  const hit = (name: string) => norm(name).includes(q);
  return [
    ...customItems.filter((x) => hit(x.name)).map((item): ExtraChoice => ({ kind: 'mia', item })),
    ...catalog.filter((x) => hit(x.name)).map((item): ExtraChoice => ({ kind: 'catalogo', item })),
    ...foods.filter((x) => hit(x.name)).map((item): ExtraChoice => ({ kind: 'alimento', item })),
  ].slice(0, 20);
}

export function newExtra(
  choice: ExtraChoice, date: string, opts: { id: string; now: Date; freeSlot: Slot | null; grams?: number }, foods: FoodIndex,
): ExtraLog {
  const base = { id: opts.id, date, qty: 1, refId: choice.item.id, freeSlot: opts.freeSlot, createdAt: opts.now.toISOString() };
  if (choice.kind === 'alimento') {
    const grams = opts.grams ?? 0;
    return { ...base, name: choice.item.name, portion: `${fmtDecimal(grams)} g`, macro: portionMacro({ foodId: choice.item.id, grams }, foods), origin: 'alimento', grams };
  }
  const { name, portion, macro } = choice.item;
  return { ...base, name, portion, macro: { ...macro }, origin: choice.kind, grams: null };
}

export function iconFor(e: ExtraLog, catalog: readonly CatalogExtra[]): FoodIconName {
  if (e.origin === 'catalogo') return catalog.find((x) => x.id === e.refId)?.icon ?? 'plate';
  if (e.origin === 'mia') return 'bookmark';
  if (e.origin === 'alimento') return 'plate';
  return 'pencil';
}
