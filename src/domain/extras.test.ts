import { describe, expect, it } from 'vitest';
import { EXTRAS_CATALOG } from './extras-catalog';
import {
  dayBalance, extraTotal, iconFor, kcalFromMacros, newExtra, parseAmount, recentItems, searchExtras,
  validateExtra, weekSummary,
} from './extras';
import { SEED_FOODS } from './catalog';
import { indexFoods } from './nutrition';
import type { CustomItem, ExtraLog, Meal, MealLog } from './types';

const foods = indexFoods(SEED_FOODS);
const pane = SEED_FOODS.find((f) => f.id === 'pane-integrale')!;
const now = new Date('2026-11-03T12:00:00Z');

function log(p: Partial<ExtraLog>): ExtraLog {
  return {
    id: Math.random().toString(36), date: '2026-11-03', name: 'Voce', portion: '', qty: 1,
    macro: { kcal: 0, p: 0, c: 0, f: 0 }, origin: 'catalogo', refId: null, grams: null, freeSlot: null,
    createdAt: '2026-11-03T10:00:00Z', ...p,
  };
}
const gelatoMacro = { kcal: 260, p: 4, c: 32, f: 12 };

describe('extras · base', () => {
  it('calcola le kcal dai macro', () => {
    expect(kcalFromMacros(4, 22, 9)).toBe(185);
    expect(kcalFromMacros(0, 0, 0)).toBe(0);
  });

  it('legge i numeri con la virgola', () => {
    expect(parseAmount('4,5')).toBe(4.5);
    expect(parseAmount(' 40.5 ')).toBe(40.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('moltiplica una voce per la quantità e somma', () => {
    const e = { macro: { kcal: 49, p: 1, c: 7, f: 2 }, qty: 2 };
    expect(extraTotal(e)).toEqual({ kcal: 98, p: 2, c: 14, f: 4 });
  });

  it('valida una voce', () => {
    const ok = { name: 'Barretta', macro: { kcal: 185, p: 4, c: 22, f: 9 }, grams: null, origin: 'manuale' as const };
    expect(validateExtra(ok)).toEqual({});
    expect(validateExtra({ ...ok, name: '  ' }).name).toBe('Scrivi cosa hai mangiato.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, kcal: 5001 } }).kcal).toBe('Le kcal devono essere tra 0 e 5000.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, f: -1 } }).macro).toBeDefined();
    expect(validateExtra({ ...ok, origin: 'alimento', grams: 0 }).grams).toBe('Inserisci i grammi.');
  });

  it('il catalogo ha 20 voci con nome e porzione separati', () => {
    expect(EXTRAS_CATALOG).toHaveLength(20);
    expect(EXTRAS_CATALOG.find((x) => x.id === 'gelato')).toMatchObject({ name: 'Gelato in coppetta', portion: '2 gusti', macro: { kcal: 260 } });
    expect(new Set(EXTRAS_CATALOG.map((x) => x.id)).size).toBe(20);
  });
});

describe('extras · bilancio', () => {
  // Colazione: 100 g di riso; cena: 200 g di pollo.
  const meals: Meal[] = [
    { slot: 'colazione', items: [{ foodId: 'riso', grams: 100, subs: [] }] },
    { slot: 'cena', items: [{ foodId: 'pollo', grams: 200, subs: [] }] },
  ];
  const kcalColazione = 332;
  const gelato = log({ refId: 'gelato', macro: gelatoMacro });
  const pizzaLibera = log({ refId: 'pizza', macro: { kcal: 900, p: 35, c: 120, f: 30 }, freeSlot: 'cena' });

  it("sceglie l'icona di una voce", () => {
    expect(iconFor(log({ origin: 'catalogo', refId: 'gelato' }), EXTRAS_CATALOG)).toBe('ice-cream');
    expect(iconFor(log({ origin: 'manuale', refId: null }), EXTRAS_CATALOG)).toBe('pencil');
    expect(iconFor(log({ origin: 'mia', refId: 'x' }), EXTRAS_CATALOG)).toBe('bookmark');
    expect(iconFor(log({ origin: 'catalogo', refId: 'sparito' }), EXTRAS_CATALOG)).toBe('plate');
  });

  it('esclude dal piano i pasti liberi e somma il fuori piano', () => {
    const b = dayBalance(meals, new Set(['colazione', 'cena']), new Set(['cena']), [gelato, pizzaLibera], foods);
    expect(b.fromPlan.kcal).toBeCloseTo(kcalColazione);
    expect(b.offPlan.kcal).toBe(260);
    expect(b.free.kcal).toBe(900);
    expect(b.total.kcal).toBeCloseTo(kcalColazione + 1160);
    expect(b.planned.kcal).toBeCloseTo(332 + 200);
    expect(b.delta).toBe(Math.round(b.total.kcal) - Math.round(b.planned.kcal));
  });

  it('conta i pasti liberi della settimana', () => {
    const week = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
    const logs: MealLog[] = [
      { date: '2026-10-31', slot: 'cena', planId: 'p', kind: 'libero' },
      { date: '2026-11-01', slot: 'pranzo', planId: 'p', kind: 'libero' },
      { date: '2026-10-26', slot: 'pranzo', planId: 'p' },
      { date: '2026-11-02', slot: 'cena', planId: 'p', kind: 'libero' }, // settimana dopo
    ];
    const extras = [
      log({ date: '2026-10-26', macro: gelatoMacro }),
      log({ date: '2026-10-31', macro: { kcal: 900, p: 0, c: 0, f: 0 }, freeSlot: 'cena' }),
      log({ date: '2026-11-02', macro: gelatoMacro }),
    ];
    expect(weekSummary(week, logs, extras)).toEqual({ offPlanKcal: 260, freeKcal: 900, freeMeals: 2, offPlanDays: 1 });
  });

  it('i recenti saltano le voci tue eliminate e i doppioni', () => {
    const r = recentItems([
      log({ refId: 'gelato', createdAt: '2026-11-03T10:00:00Z' }),
      log({ refId: 'gelato', createdAt: '2026-11-02T10:00:00Z' }),
      log({ origin: 'mia', refId: 'eliminata', createdAt: '2026-11-03T11:00:00Z' }),
      log({ origin: 'manuale', refId: null, createdAt: '2026-11-03T12:00:00Z' }),
    ], [], EXTRAS_CATALOG, foods);
    expect(r.map((x) => x.item.id)).toEqual(['gelato']);
  });

  it('la ricerca ignora accenti e mette prima le voci tue', () => {
    const mio: CustomItem = { id: 'm1', name: 'Tiramisù della nonna', portion: '', macro: gelatoMacro, createdAt: '' };
    const r = searchExtras('tiramisu', EXTRAS_CATALOG, [mio], []);
    expect(r.map((x) => x.kind)).toEqual(['mia', 'catalogo']);
    expect(searchExtras('', EXTRAS_CATALOG, [], [])).toEqual([]);
    expect(searchExtras('pane', EXTRAS_CATALOG, [], SEED_FOODS).every((x) => x.kind === 'alimento')).toBe(true);
  });

  it('una voce da alimento usa i grammi', () => {
    const e = newExtra({ kind: 'alimento', item: pane }, '2026-11-03', { id: 'x', now, freeSlot: null, grams: 40 }, foods);
    expect(e).toMatchObject({ portion: '40 g', grams: 40, qty: 1, origin: 'alimento', refId: pane.id, name: pane.name });
    expect(e.macro.kcal).toBeCloseTo(pane.per100.kcal * 0.4);
  });

  it('una voce dal catalogo copia nome, porzione e valori', () => {
    const g = EXTRAS_CATALOG.find((x) => x.id === 'gelato')!;
    const e = newExtra({ kind: 'catalogo', item: g }, '2026-11-03', { id: 'y', now, freeSlot: 'cena' }, foods);
    expect(e).toMatchObject({ name: 'Gelato in coppetta', portion: '2 gusti', macro: gelatoMacro, refId: 'gelato', freeSlot: 'cena', grams: null, createdAt: now.toISOString() });
  });
});

describe('extras · voci orfane', () => {
  it('una voce di un pasto libero che non esiste più conta come sgarro', () => {
    const orfana = log({ macro: gelatoMacro, freeSlot: 'cena' });
    const b = dayBalance([], new Set(), new Set(), [orfana], foods);
    expect(b.free.kcal).toBe(0);
    expect(b.offPlan.kcal).toBe(260);
  });
});
