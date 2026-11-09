import { describe, expect, it } from 'vitest';
import { SEED_FOODS, findSeedFoodId } from './catalog';
import { fmtGrams, indexFoods, mealMacro, portionMacro, rounded, sumMacro } from './nutrition';
import { addDays, isoWeek, mondayOf, nextMeal, skippedMeals, slotAt, weekDates, weekdayIndex } from './schedule';
import { alternativesFor, roundTo5 } from './substitutions';
import { inRange, monthGroups, parseKg, trailingAverage, upsertWeight, weeklyChange } from './weight';
import { weekRange } from '../ui/format';
import { repeatedSub, stripRecipes, validatePlan } from './validate';
import type { Meal, Plan } from './types';

const foods = indexFoods(SEED_FOODS);

describe('nutrition', () => {
  it('scala i valori per 100 g sui grammi', () => {
    const m = portionMacro({ foodId: 'riso', grams: 80 }, foods);
    expect(rounded(m)).toEqual({ kcal: 266, p: 5, c: 64, f: 0 });
  });

  it('somma un pasto senza arrotondare a ogni alimento', () => {
    const meal: Meal = { slot: 'pranzo', items: [
      { foodId: 'pasta-semola', grams: 110, subs: [] },
      { foodId: 'mozzarella', grams: 100, subs: [] },
      { foodId: 'pomodori', grams: 100, subs: [] },
      { foodId: 'olio-evo', grams: 5, subs: [] },
    ] };
    // 388,3 + 253 + 19 + 44,95
    expect(mealMacro(meal, foods).kcal).toBeCloseTo(705.25, 2);
    expect(rounded(sumMacro([meal, meal], foods)).kcal).toBe(1411);
  });

  it('un alimento sconosciuto vale zero', () => {
    expect(portionMacro({ foodId: 'nope', grams: 100 }, foods).kcal).toBe(0);
  });

  it('formatta grammi e chili', () => {
    expect(fmtGrams(80.4)).toBe('80 g');
    expect(fmtGrams(1500)).toBe('1,5 kg');
  });
});

describe('schedule', () => {
  it('lunedì è 0, domenica 6', () => {
    expect(weekdayIndex('2026-10-26')).toBe(0);
    expect(weekdayIndex('2026-11-01')).toBe(6);
  });

  it('settimana da lunedì a domenica anche a cavallo di mese e anno', () => {
    expect(mondayOf('2026-11-01')).toBe('2026-10-26');
    expect(weekDates('2027-01-01')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  });

  it('settimana ISO', () => {
    expect(isoWeek('2026-10-28')).toBe('2026-W44');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
    expect(isoWeek('2026-01-01')).toBe('2026-W01');
  });

  it('addDays attraversa il cambio dell’ora', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });

  it('il pasto "adesso" è il primo non fatto', () => {
    const day = { meals: [
      { slot: 'cena', items: [] },
      { slot: 'colazione', items: [] },
      { slot: 'pranzo', items: [] },
    ] as Meal[] };
    expect(nextMeal(day, new Set(), 0)?.slot).toBe('colazione');
    expect(nextMeal(day, new Set(['colazione']), 0)?.slot).toBe('pranzo');
    expect(nextMeal(day, new Set(['colazione', 'pranzo', 'cena']), 0)).toBeNull();
  });

  it('un pasto saltato non blocca "adesso"', () => {
    const day = { meals: [
      { slot: 'colazione', items: [] },
      { slot: 'spuntinoMattino', items: [] },
      { slot: 'pranzo', items: [] },
      { slot: 'cena', items: [] },
    ] as Meal[] };
    // Colazione e spuntino saltati, pranzo fatto: adesso è la cena.
    expect(nextMeal(day, new Set(['pranzo']), 0)?.slot).toBe('cena');
    expect(skippedMeals(day, new Set(['pranzo']), 0).map((m) => m.slot)).toEqual(['colazione', 'spuntinoMattino']);
    // Cena fatta e colazione no: nessun pasto "adesso", la colazione è saltata.
    expect(nextMeal(day, new Set(['spuntinoMattino', 'pranzo', 'cena']), 0)).toBeNull();
    expect(skippedMeals(day, new Set(['spuntinoMattino', 'pranzo', 'cena']), 0).map((m) => m.slot)).toEqual(['colazione']);
    expect(skippedMeals(day, new Set(), 0)).toEqual([]);
  });
});

describe("il pasto dell'ora", () => {
  const at = (h: number, m = 0) => h * 60 + m;
  const day = { meals: (['colazione', 'spuntinoMattino', 'pranzo', 'spuntinoPomeriggio', 'cena'] as const).map((slot) => ({ slot, items: [] })) };

  it('ogni fascia comincia alla sua ora', () => {
    expect(slotAt(at(8))).toBe('colazione');
    expect(slotAt(at(9, 59))).toBe('colazione');
    expect(slotAt(at(10))).toBe('spuntinoMattino');
    expect(slotAt(at(12))).toBe('pranzo');
    expect(slotAt(at(15, 29))).toBe('pranzo');
    expect(slotAt(at(15, 30))).toBe('spuntinoPomeriggio');
    expect(slotAt(at(18, 30))).toBe('cena');
    expect(slotAt(at(23, 59))).toBe('cena');
  });

  it('alle 20 senza niente segnato tocca la cena, e i pasti prima risultano non segnati', () => {
    expect(nextMeal(day, new Set(), at(20))?.slot).toBe('cena');
    expect(skippedMeals(day, new Set(), at(20)).map((m) => m.slot)).toEqual(['colazione', 'spuntinoMattino', 'pranzo', 'spuntinoPomeriggio']);
  });

  it("segnando il pasto dell'ora si passa al successivo, anche se la sua fascia non è ancora cominciata", () => {
    expect(nextMeal(day, new Set(['colazione']), at(8))?.slot).toBe('spuntinoMattino');
    expect(skippedMeals(day, new Set(['colazione']), at(8))).toEqual([]);
  });

  it("un pasto segnato più avanti dell'ora conta più dell'orologio", () => {
    expect(nextMeal(day, new Set(['pranzo']), at(8))?.slot).toBe('spuntinoPomeriggio');
    expect(skippedMeals(day, new Set(['pranzo']), at(8)).map((m) => m.slot)).toEqual(['colazione', 'spuntinoMattino']);
  });

  it('a cena fatta non tocca più niente, anche se i pasti prima non sono segnati', () => {
    expect(nextMeal(day, new Set(['cena']), at(21))).toBeNull();
    expect(skippedMeals(day, new Set(['cena']), at(21))).toHaveLength(4);
  });

  it('un giorno senza il pasto di quella fascia passa al successivo, o a nessuno', () => {
    const noSnacks = { meals: day.meals.filter((m) => !m.slot.startsWith('spuntino')) };
    expect(nextMeal(noSnacks, new Set(), at(11))?.slot).toBe('pranzo');
    const noDinner = { meals: day.meals.filter((m) => m.slot !== 'cena') };
    expect(nextMeal(noDinner, new Set(), at(20))).toBeNull();
    expect(skippedMeals(noDinner, new Set(), at(20))).toHaveLength(4);
  });
});

describe('substitutions', () => {
  it('applica i rapporti e arrotonda a 5 g', () => {
    const alts = alternativesFor('Pasta di semola', 80);
    expect(alts.find((a) => a.name === 'Pane')?.grams).toBe(100);
    expect(alts.find((a) => a.name === 'Patate')?.grams).toBe(320);
  });

  it('non propone lo stesso alimento', () => {
    expect(alternativesFor('Patate', 300).map((a) => a.name)).not.toContain('Patate dolci'.replace(' dolci', ''));
    expect(alternativesFor('Pane integrale', 100).map((a) => a.name)).not.toContain('Pane di segale o integrale');
  });

  it('pollo → merluzzo ×1,33, salmone ×0,68', () => {
    const alts = alternativesFor('Pollo', 200);
    expect(alts.find((a) => a.name === 'Merluzzo o nasello')?.grams).toBe(265);
    expect(alts.find((a) => a.name === 'Salmone')?.grams).toBe(135);
  });

  it('nessuna regola o grammi a zero: nessuna alternativa', () => {
    expect(alternativesFor('Sale', 5)).toEqual([]);
    expect(alternativesFor('Riso', 0)).toEqual([]);
    expect(roundTo5(12.4)).toBe(10);
  });
});

describe('weight', () => {
  const ws = [
    { date: '2026-10-01', kg: 80 },
    { date: '2026-10-05', kg: 79 },
    { date: '2026-10-07', kg: 78 },
    { date: '2026-10-14', kg: 77 },
  ];

  it('media mobile sugli ultimi 7 giorni di calendario', () => {
    expect(trailingAverage(ws, '2026-10-07')).toBe(79);
    expect(trailingAverage(ws, '2026-10-14')).toBe(77); // finestra 8–14: solo il 14
    expect(trailingAverage(ws, '2026-10-10')).toBe(78.5); // finestra 4–10: 5 e 7
    expect(trailingAverage(ws, '2026-09-01')).toBeNull();
  });

  it('variazione settimanale', () => {
    expect(weeklyChange(ws, '2026-10-14')).toBeCloseTo(-2); // 77 contro la media 1–7 (79)
  });

  it('una pesata per giorno: la nuova sostituisce', () => {
    const out = upsertWeight(ws, { date: '2026-10-05', kg: 78.5 });
    expect(out).toHaveLength(4);
    expect(out[1]).toEqual({ date: '2026-10-05', kg: 78.5 });
  });

  it('filtra per intervallo', () => {
    expect(inRange(ws, '1M', '2026-11-03').map((w) => w.date)).toEqual(['2026-10-05', '2026-10-07', '2026-10-14']);
  });

  it('legge il peso con la virgola e rifiuta valori assurdi', () => {
    expect(parseKg('78,45')).toBe(78.5);
    expect(parseKg('7')).toBeNull();
    expect(parseKg('abc')).toBeNull();
  });
});

describe('validate', () => {
  const ok = (): Plan => ({ id: 'p', name: 'P', startDate: '2026-10-26', days: Array.from({ length: 7 }, () => ({
    meals: [{ slot: 'pranzo' as const, items: [{ foodId: 'riso', grams: 80, subs: [] }] }],
  })) });

  it('un piano corretto non ha problemi', () => {
    expect(validatePlan(ok(), SEED_FOODS)).toEqual([]);
  });

  it('segnala grammi, alimenti, fasce ripetute e scambi incompleti', () => {
    const p = ok();
    const meal = p.days[2]!.meals[0]!;
    meal.items.push({ foodId: 'boh', grams: 0, subs: [{ foodId: 'riso', grams: 0 }] });
    p.days[3]!.meals.push({ ...meal, items: [] });
    const msgs = validatePlan(p, SEED_FOODS).map((i) => i.message);
    expect(msgs).toContain('Mercoledì, Pranzo: alimento non nel catalogo.');
    expect(msgs).toContain('Mercoledì, Pranzo: grammi mancanti.');
    expect(msgs).toContain('Mercoledì, Pranzo: uno scambio è incompleto.');
    expect(msgs).toContain('Giovedì, Pranzo: fascia ripetuta.');
    expect(msgs).toContain('Giovedì, Pranzo: nessun alimento.');
  });

  it('trova lo scambio ripetuto o uguale all\'alimento', () => {
    expect(repeatedSub('riso', [{ foodId: 'pane-integrale' }, { foodId: 'patate' }])).toBeNull();
    expect(repeatedSub('riso', [{ foodId: 'pane-integrale' }, { foodId: 'pane-integrale' }])).toBe('pane-integrale');
    expect(repeatedSub('riso', [{ foodId: 'riso' }])).toBe('riso');
  });

  it('segnala gli scambi doppi in un piano', () => {
    const p = ok();
    p.days[0]!.meals[0]!.items[0]!.subs = [{ foodId: 'patate', grams: 300 }, { foodId: 'patate', grams: 300 }];
    expect(validatePlan(p, SEED_FOODS).map((i) => i.message)).toEqual(['Lunedì, Pranzo: uno scambio è ripetuto.']);
  });
});

describe('catalog', () => {
  it('riconosce i nomi della v1', () => {
    expect(findSeedFoodId('Uova (3)')).toBe('uova');
    expect(findSeedFoodId('Pasta all’uovo')).toBe('pasta-uovo');
    expect(findSeedFoodId('Latte p.s.')).toBe('latte-ps');
    expect(findSeedFoodId('Coscia (con osso)')).toBe('pollo-coscia');
  });

  it('id unici', () => {
    expect(new Set(SEED_FOODS.map((f) => f.id)).size).toBe(SEED_FOODS.length);
  });
});

describe('piano senza ricette', () => {
  it('toglie titoli e note dai pasti, lascia alimenti e scambi', () => {
    const old = {
      id: 'p', name: 'P', startDate: '2026-11-02',
      days: [{ meals: [{ slot: 'pranzo', title: 'Pasta caprese', note: 'Basilico', items: [{ foodId: 'riso', grams: 80, subs: [{ foodId: 'pane-integrale', grams: 100 }] }] }] }],
    } as unknown as Plan;
    expect(stripRecipes(old).days[0]!.meals[0]).toEqual({ slot: 'pranzo', items: [{ foodId: 'riso', grams: 80, subs: [{ foodId: 'pane-integrale', grams: 100 }] }] });
  });
});

describe('ordine delle schermate', () => {
  it('raggruppa le pesate per mese, dalla più recente', () => {
    const groups = monthGroups([{ date: '2026-10-30', kg: 79 }, { date: '2026-11-05', kg: 78.5 }, { date: '2026-11-02', kg: 78.8 }]);
    expect(groups.map((g) => g.month)).toEqual(['2026-11', '2026-10']);
    expect(groups[0]!.items.map((w) => w.date)).toEqual(['2026-11-05', '2026-11-02']);
  });

  it('dice i giorni della settimana con le preposizioni giuste', () => {
    expect(weekRange('2026-11-02', '2026-11-08')).toBe("dal 2 all'8 nov");
    expect(weekRange('2026-10-26', '2026-11-01')).toBe('dal 26 ott al 1° nov');
    expect(weekRange('2026-06-08', '2026-06-14')).toBe("dall'8 al 14 giu");
    expect(weekRange('2026-12-28', '2027-01-03')).toBe('dal 28 dic al 3 gen');
    expect(weekRange('2026-06-01', '2026-06-07')).toBe('dal 1° al 7 giu');
    expect(weekRange('2026-05-11', '2026-05-17')).toBe("dall'11 al 17 mag");
  });
});
