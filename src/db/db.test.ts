import { afterEach, describe, expect, it } from 'vitest';
import { AppDb } from './schema';
import { ensureStartup, V1_KEYS } from './migrate';
import { activePlan, getSettings, logsBetween, putWeight, setMealDone } from './repos';
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
