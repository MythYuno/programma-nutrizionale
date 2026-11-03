import type { AppDb } from './schema';
import type { CustomItem, ExtraLog, Food, ItemLog, LegacyWeek, MealLog, Plan, Settings, Weight } from '../domain/types';
import { getSettings } from './repos';
import { stripRecipes } from '../domain/validate';

export interface Backup {
  app: 'programma-nutrizionale';
  version: 2 | 3 | 4; // la 3 aggiunge le voci fuori piano, la 4 scambi e grammi
  exportedAt: string;
  foods: Food[];
  plans: Plan[];
  mealLogs: MealLog[];
  weights: Weight[];
  legacyWeeks: LegacyWeek[];
  settings: Settings;
  extras: ExtraLog[];
  customItems: CustomItem[];
  itemLogs: ItemLog[];
}

export async function exportBackup(db: AppDb, now = new Date()): Promise<Backup> {
  return {
    app: 'programma-nutrizionale',
    version: 4,
    exportedAt: now.toISOString(),
    foods: await db.foods.toArray(),
    plans: await db.plans.toArray(),
    mealLogs: await db.mealLogs.toArray(),
    weights: await db.weights.toArray(),
    legacyWeeks: await db.legacyWeeks.toArray(),
    settings: await getSettings(db),
    extras: await db.extras.toArray(),
    customItems: await db.customItems.toArray(),
    itemLogs: await db.itemLogs.toArray(),
  };
}

export interface BackupSummary {
  plans: number;
  foods: number;
  mealLogs: number;
  freeMeals: number;
  weights: number;
  extras: number;
  exportedAt: string;
}

// Controllo di forma prima di toccare i dati: meglio rifiutare un file che
// sovrascrivere tutto con qualcosa di mezzo rotto.
export function parseBackup(text: string): { backup: Backup; summary: BackupSummary } | { error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: 'Il file non è un JSON valido.' }; }
  const b = raw as Partial<Backup>;
  if (!b || b.app !== 'programma-nutrizionale') return { error: 'Non è un backup di Programma Nutrizionale.' };
  if (b.version !== 2 && b.version !== 3 && b.version !== 4) return { error: `Versione del backup non supportata (${String(b.version)}).` };
  const arrays = ['foods', 'plans', 'mealLogs', 'weights', 'legacyWeeks'] as const;
  for (const k of arrays) if (!Array.isArray(b[k])) return { error: `Nel backup manca "${k}".` };
  if (!b.settings || typeof b.settings !== 'object') return { error: 'Nel backup mancano le impostazioni.' };
  if (b.plans!.some((p) => !Array.isArray(p.days) || p.days.length !== 7)) return { error: 'Un piano nel backup non ha 7 giorni.' };
  // Un backup della versione 2 non ha voci fuori piano.
  const extras = Array.isArray(b.extras) ? b.extras : [];
  const customItems = Array.isArray(b.customItems) ? b.customItems : [];
  const itemLogs = Array.isArray(b.itemLogs) ? b.itemLogs : [];
  // Un backup di una versione precedente può avere titoli e note: si tolgono.
  const backup = { ...(b as Backup), plans: (b.plans as Plan[]).map(stripRecipes), extras, customItems, itemLogs };
  return {
    backup,
    summary: {
      plans: backup.plans.length, foods: backup.foods.length,
      mealLogs: backup.mealLogs.filter((l) => l.kind !== 'libero').length,
      freeMeals: backup.mealLogs.filter((l) => l.kind === 'libero').length,
      weights: backup.weights.length, extras: extras.length, exportedAt: backup.exportedAt,
    },
  };
}

export async function restoreBackup(db: AppDb, b: Backup) {
  const tables = [db.foods, db.plans, db.mealLogs, db.weights, db.legacyWeeks, db.settings, db.extras, db.customItems, db.itemLogs];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.foods.bulkPut(b.foods);
    await db.plans.bulkPut(b.plans);
    await db.mealLogs.bulkPut(b.mealLogs);
    await db.weights.bulkPut(b.weights);
    await db.legacyWeeks.bulkPut(b.legacyWeeks);
    await db.settings.put({ key: 'settings', ...b.settings, migratedFromV1: true });
    await db.extras.bulkPut(b.extras ?? []);
    await db.customItems.bulkPut(b.customItems ?? []);
    await db.itemLogs.bulkPut(b.itemLogs ?? []);
  });
}

export function backupFileName(now = new Date()): string {
  return `programma-nutrizionale-${now.toISOString().slice(0, 10)}.json`;
}
