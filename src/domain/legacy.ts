// Conversione dei dati della v1 (localStorage) nel modello v2.
import type { Food, LegacyWeek, Meal, MealLog, Plan, PlanItem, Portion, Slot } from './types';
import { SLOTS } from './types';
import { findSeedFoodId, normalizeName } from './catalog';
import { addDays, isoDate } from './schedule';

export type LegacyIng = [string, string];

export interface LegacyMeal {
  kick?: string;
  title: string;
  time?: string;
  prep?: boolean;
  ing: LegacyIng[];
  sub?: Record<string, LegacyIng[]>;
  liberi?: string;
  oppure?: string;
  tip?: string;
  steps?: string[];
  altsTitle?: string;
  alts?: string[];
}

export interface LegacyPlan {
  colazione: LegacyMeal;
  spMattino: LegacyMeal;
  spPomeriggio: LegacyMeal;
  days: { id: string; name: string; full: string; pranzo: LegacyMeal; cena: LegacyMeal }[];
}

export interface ConvertedPlan {
  plan: Plan;
  newFoods: Food[]; // alimenti non riconosciuti, creati come "manuale" a macro zero
  warnings: string[];
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Solo quantità in peso. Le uova a pezzi valgono 55 g l'una come nella v1.
export function legacyGrams(q: string, name: string): number | null {
  const s = String(q).trim();
  const m = s.replace(',', '.').match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  if (/\bkg\b/i.test(s)) return n * 1000;
  if (/\bg\b/i.test(s)) return n;
  if (/uov/i.test(name) && /^\d+$/.test(s)) return n * 55;
  return null;
}

function slugify(name: string): string {
  return 'v1-' + normalizeName(name).normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function noteFor(m: LegacyMeal, skipped: string[]): string {
  const parts: string[] = [];
  if (m.liberi && m.liberi !== '—') parts.push('Liberi: ' + stripHtml(m.liberi));
  if (m.oppure) parts.push(stripHtml(m.oppure));
  if (skipped.length) parts.push('Scambi senza grammi: ' + skipped.join(', ') + '.');
  if (m.steps?.length) parts.push(m.steps.map((s, i) => `${i + 1}. ${stripHtml(s)}`).join('\n'));
  if (m.tip) parts.push('Consiglio: ' + stripHtml(m.tip));
  if (m.alts?.length) parts.push((m.altsTitle ?? 'Alternative') + ':\n' + m.alts.map((a) => '• ' + stripHtml(a)).join('\n'));
  return parts.join('\n\n');
}

export function convertLegacyPlan(lp: LegacyPlan, planId: string, startDate: string): ConvertedPlan {
  const newFoods = new Map<string, Food>();
  const warnings: string[] = [];

  const foodId = (name: string): string => {
    const seed = findSeedFoodId(name);
    if (seed) return seed;
    const id = slugify(name);
    if (!newFoods.has(id)) {
      newFoods.set(id, { id, name: name.replace(/\s*\([^)]*\)/g, '').trim(), category: 'Altro', source: 'manuale', per100: { kcal: 0, p: 0, c: 0, f: 0 } });
      warnings.push(`"${name}" non è nel catalogo: aggiunto con valori a zero, da completare.`);
    }
    return id;
  };

  const meal = (m: LegacyMeal, slot: Slot): Meal => {
    const skipped: string[] = [];
    const items: PlanItem[] = [];
    for (const [name, q] of m.ing) {
      const grams = legacyGrams(q, name);
      if (grams === null) { skipped.push(`${name} ${q}`); continue; }
      const subs: Portion[] = [];
      for (const [sn, sq] of m.sub?.[name] ?? []) {
        const sg = legacyGrams(sq, sn);
        if (sg === null) skipped.push(`${sn} ${sq}`);
        else subs.push({ foodId: foodId(sn), grams: sg });
      }
      items.push({ foodId: foodId(name), grams, subs });
    }
    return { slot, title: m.title, note: noteFor(m, skipped), items };
  };

  const days = lp.days.map((d) => ({
    meals: [
      meal(lp.colazione, 'colazione'),
      meal(lp.spMattino, 'spuntinoMattino'),
      meal(d.pranzo, 'pranzo'),
      meal(lp.spPomeriggio, 'spuntinoPomeriggio'),
      meal(d.cena, 'cena'),
    ],
  }));

  return { plan: { id: planId, name: 'Piano Dott. Occhino', startDate, days }, newFoods: [...newFoods.values()], warnings };
}

// "2026-W44" (la v1 non mette lo zero: anche "2026-W5") → lunedì di quella settimana
export function mondayOfIsoWeek(week: string): string | null {
  const m = week.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = new Date(y, 0, 4);
  const mon1 = new Date(y, 0, 4 - ((jan4.getDay() + 6) % 7));
  return addDays(isoDate(mon1), (w - 1) * 7);
}

// v1: { w: "2026-W44", d: ["2-0", "2-1", …] } con "giorno-fascia", entrambi da 0
export function convertLegacyDone(raw: unknown, planId: string): MealLog[] {
  if (!raw || typeof raw !== 'object') return [];
  const { w, d } = raw as { w?: unknown; d?: unknown };
  const monday = typeof w === 'string' ? mondayOfIsoWeek(w) : null;
  if (!monday || !Array.isArray(d)) return [];
  const logs: MealLog[] = [];
  for (const key of d) {
    const [day, slot] = String(key).split('-').map(Number);
    const s = SLOTS[slot!];
    if (s && day! >= 0 && day! <= 6) logs.push({ date: addDays(monday, day!), slot: s, planId });
  }
  return logs;
}

export function convertLegacyHistory(raw: unknown): LegacyWeek[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x.w === 'string' && typeof x.n === 'number')
    .map((x) => ({
      week: x.w.replace(/-W(\d)$/, '-W0$1'),
      done: x.n,
      total: typeof x.tot === 'number' ? x.tot : 35,
      perSlot: Array.isArray(x.per) ? x.per.map(Number) : [],
    }));
}
