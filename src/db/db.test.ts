import { afterEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { AppDb } from './schema';
import { ensureStartup, V1_KEYS } from './migrate';
import { activePlan, getSettings, logsBetween, putCustomItem, putExtra, putItemLog, putMealLog, putWeight, setMealDone } from './repos';
import { exportBackup, parseBackup, restoreBackup } from './backup';
import { SEED_FOODS } from '../domain/catalog';

let n = 0;
const dbs: AppDb[] = [];
function freshDb() {
  const db = new AppDb('test-' + n++);
  dbs.push(db);
  return db;
}
afterEach(async () => { for (const db of dbs.splice(0)) await db.delete(); });

function storage(data: Record<string, unknown>) {
  return { getItem: (k: string) => (k in data ? JSON.stringify(data[k]) : null) };
}

describe('primo avvio', () => {
  it('senza dati v1: catalogo + piano di default attivo', async () => {
    const db = freshDb();
    const r = await ensureStartup(db, storage({}), '2026-10-28');
    expect(r).toEqual({ migrated: true, warnings: [] });
    expect(await db.foods.count()).toBe(SEED_FOODS.length);
    const plan = await activePlan(db);
    expect(plan?.days).toHaveLength(7);
    expect(plan?.startDate).toBe('2026-10-26');
  });

  it('importa pasti fatti e storico della v1, una volta sola', async () => {
    const db = freshDb();
    const s = storage({
      [V1_KEYS.done]: { w: '2026-W44', d: ['0-0', '1-2'] },
      [V1_KEYS.history]: [{ w: '2026-W43', n: 31, tot: 35, per: [7, 7, 6, 6, 5] }],
    });
    await ensureStartup(db, s, '2026-10-28');
    expect((await logsBetween(db, '2026-10-26', '2026-11-01')).map((l) => `${l.date} ${l.slot}`)).toEqual(['2026-10-26 colazione', '2026-10-27 pranzo']);
    expect(await db.legacyWeeks.get('2026-W43')).toMatchObject({ done: 31 });
    expect(await ensureStartup(db, s, '2026-10-28')).toEqual({ migrated: false, warnings: [] });
  });

  it('piano v1 illeggibile: avvisa e usa il default', async () => {
    const db = freshDb();
    const r = await ensureStartup(db, storage({ [V1_KEYS.plan]: { days: 3 } }), '2026-10-28');
    expect(r.warnings[0]).toMatch(/non era leggibile/);
    expect(await activePlan(db)).not.toBeNull();
  });

  it('piano v1 modificato a mano: alimenti nuovi a valori zero', async () => {
    const db = freshDb();
    const meal = { title: 'X', ing: [['Seppia', '200 g']] };
    const plan = { colazione: meal, spMattino: meal, spPomeriggio: meal, days: Array.from({ length: 7 }, (_, i) => ({ id: String(i), name: 'D', full: 'D', pranzo: meal, cena: meal })) };
    const r = await ensureStartup(db, storage({ [V1_KEYS.plan]: plan }), '2026-10-28');
    expect(r.warnings).toEqual(['"Seppia" non è nel catalogo: aggiunto con valori a zero, da completare.']);
    expect(await db.foods.get('v1-seppia')).toMatchObject({ source: 'manuale', per100: { kcal: 0 } });
  });
});

describe('backup', () => {
  it('andata e ritorno senza perdite', async () => {
    const a = freshDb();
    await ensureStartup(a, storage({}), '2026-10-28');
    await putWeight(a, { date: '2026-10-28', kg: 78.2 });
    await setMealDone(a, { date: '2026-10-28', slot: 'pranzo', planId: 'piano-v1' }, true);
    const text = JSON.stringify(await exportBackup(a));

    const parsed = parseBackup(text);
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.summary).toMatchObject({ plans: 1, weights: 1, mealLogs: 1 });

    const b = freshDb();
    await restoreBackup(b, parsed.backup);
    expect(await b.weights.toArray()).toEqual([{ date: '2026-10-28', kg: 78.2 }]);
    expect((await activePlan(b))?.name).toBe('Piano Dott. Occhino');
    expect((await getSettings(b)).migratedFromV1).toBe(true);
  });

  it('rifiuta file sbagliati', () => {
    expect(parseBackup('{')).toEqual({ error: 'Il file non è un JSON valido.' });
    expect(parseBackup('{"app":"altro"}')).toEqual({ error: 'Non è un backup di Programma Nutrizionale.' });
    expect(parseBackup('{"app":"programma-nutrizionale","version":1}')).toMatchObject({ error: expect.stringMatching(/Versione/) });
  });

  it('annullare un pasto fatto lo toglie', async () => {
    const db = freshDb();
    const log = { date: '2026-10-28', slot: 'cena' as const, planId: 'p' };
    await setMealDone(db, log, true);
    await setMealDone(db, log, false);
    expect(await db.mealLogs.count()).toBe(0);
  });
});

describe('fuori piano nel database', () => {
  const extra = {
    id: 'e1', date: '2026-11-03', name: 'Gelato in coppetta', portion: '2 gusti', qty: 2,
    macro: { kcal: 260, p: 4, c: 32, f: 12 }, origin: 'catalogo' as const, refId: 'gelato',
    grams: null, freeSlot: null, createdAt: '2026-11-03T10:00:00.000Z',
  };
  const mine = { id: 'c1', name: 'Barretta', portion: '1 barretta', macro: { kcal: 190, p: 20, c: 18, f: 6 }, createdAt: '2026-11-03T10:00:00.000Z' };

  it('passa dallo schema 1 al 2 senza perdere dati', async () => {
    const name = 'test-upgrade-' + n++;
    const v1 = new Dexie(name);
    v1.version(1).stores({ foods: 'id, name', plans: 'id', mealLogs: '[date+slot], date', weights: 'date', legacyWeeks: 'week', settings: 'key' });
    await v1.table('weights').put({ date: '2026-11-01', kg: 79 });
    v1.close();
    const db = new AppDb(name);
    dbs.push(db);
    expect(await db.weights.get('2026-11-01')).toEqual({ date: '2026-11-01', kg: 79 });
    expect(await db.extras.count()).toBe(0);
  });

  it('il backup v3 contiene voci fuori piano e voci tue', async () => {
    const a = freshDb();
    await ensureStartup(a, storage({}), '2026-11-03');
    await putExtra(a, extra);
    await putCustomItem(a, mine);
    const exported = await exportBackup(a);
    expect(exported.version).toBe(4);
    const parsed = parseBackup(JSON.stringify(exported));
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.summary.extras).toBe(1);
    const b = freshDb();
    await restoreBackup(b, parsed.backup);
    expect(await b.extras.toArray()).toEqual([extra]);
    expect(await b.customItems.toArray()).toEqual([mine]);
  });

  it('importa ancora un backup v2', async () => {
    const a = freshDb();
    await ensureStartup(a, storage({}), '2026-11-03');
    const { extras: _e, customItems: _c, ...rest } = await exportBackup(a);
    const parsed = parseBackup(JSON.stringify({ ...rest, version: 2 }));
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.backup.extras).toEqual([]);
    expect(parsed.backup.customItems).toEqual([]);
    expect(parsed.summary.extras).toBe(0);
  });
});

describe('piano senza ricette nel database', () => {
  const oldPlan = {
    id: 'piano-v1', name: 'Piano', startDate: '2026-11-02',
    days: Array.from({ length: 7 }, () => ({ meals: [{ slot: 'pranzo', title: 'Pasta caprese', note: 'Basilico', items: [{ foodId: 'riso', grams: 80, subs: [] }] }] })),
  };

  it("l'aggiornamento allo schema 3 toglie titoli e note dal piano salvato", async () => {
    const name = 'test-strip-' + n++;
    const v2 = new Dexie(name);
    v2.version(1).stores({ foods: 'id, name', plans: 'id', mealLogs: '[date+slot], date', weights: 'date', legacyWeeks: 'week', settings: 'key' });
    v2.version(2).stores({ extras: 'id, date', customItems: 'id, name' });
    await v2.table('plans').put(oldPlan);
    v2.close();
    const db = new AppDb(name);
    dbs.push(db);
    const meal = (await db.plans.get('piano-v1'))!.days[0]!.meals[0]!;
    expect(meal).toEqual({ slot: 'pranzo', items: [{ foodId: 'riso', grams: 80, subs: [] }] });
  });

  it('un backup con titoli e note viene ripulito', async () => {
    const a = freshDb();
    await ensureStartup(a, storage({}), '2026-11-03');
    const b = await exportBackup(a);
    const parsed = parseBackup(JSON.stringify({ ...b, plans: [oldPlan] }));
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.backup.plans[0]!.days[0]!.meals[0]).not.toHaveProperty('title');
    expect(parsed.backup.plans[0]!.days[0]!.meals[0]).not.toHaveProperty('note');
  });
});

describe('scambi e grammi nel database', () => {
  const itemLog = { date: '2026-11-04', slot: 'cena' as const, index: 0, planFoodId: 'manzo-magro', foodId: 'pollo', grams: 253 };

  it('passa allo schema 4 senza perdere dati', async () => {
    const name = 'test-v4-' + n++;
    const v3 = new Dexie(name);
    v3.version(1).stores({ foods: 'id, name', plans: 'id', mealLogs: '[date+slot], date', weights: 'date', legacyWeeks: 'week', settings: 'key' });
    v3.version(2).stores({ extras: 'id, date', customItems: 'id, name' });
    v3.version(3).stores({});
    await v3.table('weights').put({ date: '2026-11-01', kg: 79 });
    v3.close();
    const db = new AppDb(name);
    dbs.push(db);
    expect(await db.weights.get('2026-11-01')).toEqual({ date: '2026-11-01', kg: 79 });
    expect(await db.itemLogs.count()).toBe(0);
  });

  it('il backup v4 porta gli scambi; un v3 si importa ancora', async () => {
    const a = freshDb();
    await ensureStartup(a, storage({}), '2026-11-03');
    await putItemLog(a, itemLog);
    await putMealLog(a, { date: '2026-11-04', slot: 'pranzo', planId: 'p', kind: 'libero' });
    await setMealDone(a, { date: '2026-11-04', slot: 'colazione', planId: 'p' }, true);
    const exported = await exportBackup(a);
    expect(exported.version).toBe(4);
    const parsed = parseBackup(JSON.stringify(exported));
    if ('error' in parsed) throw new Error(parsed.error);
    expect(parsed.summary).toMatchObject({ mealLogs: 1, freeMeals: 1 });
    const b = freshDb();
    await restoreBackup(b, parsed.backup);
    expect(await b.itemLogs.toArray()).toEqual([itemLog]);
    const { itemLogs: _i, ...v3 } = exported;
    const old = parseBackup(JSON.stringify({ ...v3, version: 3 }));
    if ('error' in old) throw new Error(old.error);
    expect(old.backup.itemLogs).toEqual([]);
  });
});
