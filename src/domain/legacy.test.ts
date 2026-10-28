import { describe, expect, it } from 'vitest';
import { convertLegacyDone, convertLegacyHistory, convertLegacyPlan, legacyGrams, mondayOfIsoWeek } from './legacy';
import { LEGACY_DEFAULT_PLAN } from './legacy-default';
import { SEED_FOODS } from './catalog';
import { validatePlan } from './validate';

describe('convertLegacyPlan con il piano reale della v1', () => {
  const { plan, newFoods, warnings } = convertLegacyPlan(LEGACY_DEFAULT_PLAN, 'p1', '2026-10-26');

  it('produce 7 giorni da 5 pasti, colazione e spuntini ripetuti', () => {
    expect(plan.days).toHaveLength(7);
    for (const d of plan.days) expect(d.meals.map((m) => m.slot)).toEqual(['colazione', 'spuntinoMattino', 'pranzo', 'spuntinoPomeriggio', 'cena']);
    expect(plan.days[4]!.meals[0]!.title).toBe('Latte e cereali');
  });

  it('riconosce tutti gli alimenti del piano', () => {
    expect(newFoods.map((f) => f.name)).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('è valido per l’editor', () => {
    expect(validatePlan(plan, [...SEED_FOODS, ...newFoods])).toEqual([]);
  });

  it('porta grammi e scambi del medico', () => {
    const cenaMer = plan.days[2]!.meals[4]!;
    expect(cenaMer.title).toBe('Manzo magro alla griglia');
    const manzo = cenaMer.items[0]!;
    expect(manzo).toMatchObject({ foodId: 'manzo-magro', grams: 220 });
    expect(manzo.subs).toContainEqual({ foodId: 'pollo', grams: 253 });
    expect(manzo.subs).toContainEqual({ foodId: 'feta', grams: 112 });
  });

  it('mette liberi, passi e consigli nella nota, senza HTML', () => {
    const pranzoMar = plan.days[1]!.meals[2]!;
    expect(pranzoMar.note).toContain('Liberi: Limone e spezie — no sale');
    expect(pranzoMar.note).toContain('Consiglio: Lessa 300 g di orzo');
    expect(pranzoMar.note).not.toMatch(/<b>/);
  });

  it('gli scambi senza grammi finiscono nella nota', () => {
    const cenaDom = plan.days[6]!.meals[4]!;
    expect(cenaDom.items[1]!.subs).toEqual([]);
    expect(cenaDom.note).toContain('Scambi senza grammi: Wasa q.b.');
  });
});

describe('dati di tracciamento v1', () => {
  it('grammi: g, kg, uova a pezzi, q.b.', () => {
    expect(legacyGrams('110 g', 'Pasta')).toBe(110);
    expect(legacyGrams('1,5 kg', 'Patate')).toBe(1500);
    expect(legacyGrams('2', 'Uova')).toBe(110);
    expect(legacyGrams('q.b.', 'Wasa')).toBeNull();
  });

  it('lunedì della settimana ISO, con o senza zero', () => {
    expect(mondayOfIsoWeek('2026-W44')).toBe('2026-10-26');
    expect(mondayOfIsoWeek('2026-W1')).toBe('2025-12-29');
    expect(mondayOfIsoWeek('boh')).toBeNull();
  });

  it('pasti fatti → date reali', () => {
    const logs = convertLegacyDone({ w: '2026-W44', d: ['0-0', '2-4', '9-1', 'x'] }, 'p1');
    expect(logs).toEqual([
      { date: '2026-10-26', slot: 'colazione', planId: 'p1' },
      { date: '2026-10-28', slot: 'cena', planId: 'p1' },
    ]);
    expect(convertLegacyDone(null, 'p1')).toEqual([]);
  });

  it('storico settimanale', () => {
    expect(convertLegacyHistory([{ w: '2026-W5', n: 30, tot: 35, per: [7, 7, 6, 5, 5] }, { bad: 1 }])).toEqual([
      { week: '2026-W05', done: 30, total: 35, perSlot: [7, 7, 6, 5, 5] },
    ]);
  });
});
