// Primo avvio: catalogo iniziale e passaggio una tantum dai dati della v1.
import type { AppDb } from './schema';
import { SEED_FOODS } from '../domain/catalog';
import { convertLegacyDone, convertLegacyHistory, convertLegacyPlan, type LegacyPlan } from '../domain/legacy';
import { LEGACY_DEFAULT_PLAN } from '../domain/legacy-default';
import { isoDate, mondayOf } from '../domain/schedule';
import { getSettings, updateSettings } from './repos';

export const V1_KEYS = { plan: 'piano11-plan-v1', done: 'piano11-fatti', history: 'piano11-storico' };

export interface StartupReport {
  migrated: boolean;
  warnings: string[];
}

function readJson(storage: Pick<Storage, 'getItem'> | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function looksLikeLegacyPlan(p: unknown): p is LegacyPlan {
  const lp = p as LegacyPlan;
  return !!lp && Array.isArray(lp.colazione?.ing) && Array.isArray(lp.days) && lp.days.length === 7
    && lp.days.every((d) => Array.isArray(d?.pranzo?.ing) && Array.isArray(d?.cena?.ing));
}

export async function ensureStartup(db: AppDb, storage: Pick<Storage, 'getItem'> | null, today = isoDate(new Date())): Promise<StartupReport> {
  if ((await db.foods.count()) === 0) await db.foods.bulkPut(SEED_FOODS);

  const settings = await getSettings(db);
  if (settings.migratedFromV1) return { migrated: false, warnings: [] };

  const warnings: string[] = [];
  const planId = 'piano-v1';
  let source: LegacyPlan = LEGACY_DEFAULT_PLAN;
  const saved = readJson(storage, V1_KEYS.plan);
  if (saved) {
    if (looksLikeLegacyPlan(saved)) source = saved;
    else warnings.push('Il piano salvato nella vecchia versione non era leggibile: uso il piano di default.');
  }

  try {
    const { plan, newFoods, warnings: w } = convertLegacyPlan(source, planId, mondayOf(today));
    warnings.push(...w);
    await db.transaction('rw', [db.foods, db.plans, db.mealLogs, db.legacyWeeks, db.settings], async () => {
      await db.foods.bulkPut(newFoods);
      await db.plans.put(plan);
      await db.mealLogs.bulkPut(convertLegacyDone(readJson(storage, V1_KEYS.done), planId));
      await db.legacyWeeks.bulkPut(convertLegacyHistory(readJson(storage, V1_KEYS.history)));
      await updateSettings(db, { activePlanId: planId, migratedFromV1: true });
    });
  } catch (e) {
    // Non si blocca mai l'avvio: al limite si riparte dal piano di default.
    warnings.push('Non sono riuscito a importare i dati della vecchia versione.');
    const { plan, newFoods } = convertLegacyPlan(LEGACY_DEFAULT_PLAN, planId, mondayOf(today));
    await db.foods.bulkPut(newFoods);
    await db.plans.put(plan);
    await updateSettings(db, { activePlanId: planId, migratedFromV1: true });
  }
  return { migrated: true, warnings };
}

export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
