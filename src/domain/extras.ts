// Calcoli per le voci fuori piano e il pasto libero. Tutti i valori sono stime.
import type { ExtraLog, ExtraOrigin, Macro } from './types';
import { add, ZERO } from './nutrition';

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
