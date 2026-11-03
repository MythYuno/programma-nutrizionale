import { describe, expect, it } from 'vitest';
import { SEED_FOODS } from './catalog';
import { indexFoods, mealMacro } from './nutrition';
import { choiceGrams, eatenItems, eatenMealMacro } from './eaten';
import { dayBalance, weekSummary } from './extras';
import type { ExtraLog, ItemLog, Meal } from './types';

const foods = indexFoods(SEED_FOODS);
const D = '2026-11-04';
const cena: Meal = {
  slot: 'cena',
  items: [
    { foodId: 'manzo-magro', grams: 220, subs: [{ foodId: 'pollo', grams: 253 }, { foodId: 'feta', grams: 112 }] },
    { foodId: 'pane-integrale', grams: 130, subs: [{ foodId: 'patate', grams: 380 }] },
  ],
};
const log = (p: Partial<ItemLog>): ItemLog => ({ date: D, slot: 'cena', index: 0, planFoodId: 'manzo-magro', foodId: 'manzo-magro', grams: 220, ...p });

describe('alimenti mangiati', () => {
  it('sa quanti grammi prevede il piano o uno scambio', () => {
    expect(choiceGrams(cena.items[0]!, 'manzo-magro')).toBe(220);
    expect(choiceGrams(cena.items[0]!, 'pollo')).toBe(253);
    expect(choiceGrams(cena.items[0]!, 'riso')).toBeNull();
  });

  it('senza modifiche gli alimenti sono quelli del piano', () => {
    expect(eatenItems(cena, [], D).map((e) => [e.foodId, e.grams, e.swapped, e.changed])).toEqual([
      ['manzo-magro', 220, false, false],
      ['pane-integrale', 130, false, false],
    ]);
  });

  it('uno scambio e dei grammi diversi', () => {
    const logs = [log({ foodId: 'pollo', grams: 253 }), log({ index: 1, planFoodId: 'pane-integrale', foodId: 'pane-integrale', grams: 100 })];
    const e = eatenItems(cena, logs, D);
    expect(e[0]).toMatchObject({ foodId: 'pollo', grams: 253, swapped: true, changed: false, planFoodId: 'manzo-magro', planGrams: 220 });
    expect(e[1]).toMatchObject({ foodId: 'pane-integrale', grams: 100, swapped: false, changed: true });
  });

  it('ignora un log di un altro giorno o di un alimento che non è più nel piano', () => {
    const e = eatenItems(cena, [log({ foodId: 'pollo', grams: 253, date: '2026-11-05' }), log({ planFoodId: 'merluzzo', foodId: 'pollo' })], D);
    expect(e[0]!.foodId).toBe('manzo-magro');
  });

  it('i macro del pasto usano quello che si è mangiato', () => {
    const logs = [log({ foodId: 'pollo', grams: 253 })];
    const pollo = SEED_FOODS.find((f) => f.id === 'pollo')!;
    const pane = SEED_FOODS.find((f) => f.id === 'pane-integrale')!;
    expect(eatenMealMacro(cena, logs, D, foods).kcal).toBeCloseTo(pollo.per100.kcal * 2.53 + pane.per100.kcal * 1.3);
  });

  it('il bilancio usa i log per il piano fatto, non per il previsto', () => {
    const logs = [log({ foodId: 'pollo', grams: 253 })];
    const b = dayBalance([cena], new Set(['cena']), new Set(), [], foods, logs);
    expect(b.fromPlan.kcal).toBeCloseTo(eatenMealMacro(cena, logs, D, foods).kcal);
    expect(b.planned.kcal).toBeCloseTo(mealMacro(cena, foods).kcal);
  });

  it('un pasto libero resta fuori dal piano anche con un log', () => {
    const b = dayBalance([cena], new Set(['cena']), new Set(['cena']), [], foods, [log({ foodId: 'pollo', grams: 253 })]);
    expect(b.fromPlan.kcal).toBe(0);
  });
});

describe('settimana · voci orfane', () => {
  it('una voce con un pasto libero inesistente conta tra gli sgarri', () => {
    const orfana: ExtraLog = {
      id: 'o', date: D, name: 'Gelato', portion: '', qty: 1, macro: { kcal: 260, p: 0, c: 0, f: 0 },
      origin: 'catalogo', refId: 'gelato', grams: null, freeSlot: 'cena', createdAt: '',
    };
    expect(weekSummary([D], [], [orfana])).toMatchObject({ offPlanKcal: 260, freeKcal: 0, offPlanDays: 1 });
  });
});
