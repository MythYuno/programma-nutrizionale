import type { AppDb } from './schema';
import type { Food, LegacyWeek, MealLog, Plan, Settings, Weight } from '../domain/types';
import { getSettings } from './repos';

export interface Backup {
  app: 'programma-nutrizionale';
  version: 2;
  exportedAt: string;
  foods: Food[];
  plans: Plan[];
  mealLogs: MealLog[];
  weights: Weight[];
  legacyWeeks: LegacyWeek[];
  settings: Settings;
}

export async function exportBackup(db: AppDb, now = new Date()): Promise<Backup> {
  return {
    app: 'programma-nutrizionale',
    version: 2,
    exportedAt: now.toISOString(),
    foods: await db.foods.toArray(),
    plans: await db.plans.toArray(),
    mealLogs: await db.mealLogs.toArray(),
    weights: await db.weights.toArray(),
    legacyWeeks: await db.legacyWeeks.toArray(),
    settings: await getSettings(db),
  };
}

export interface BackupSummary {
  plans: number;
  foods: number;
  mealLogs: number;
  weights: number;
  exportedAt: string;
}

// Controllo di forma prima di toccare i dati: meglio rifiutare un file che
// sovrascrivere tutto con qualcosa di mezzo rotto.
export function parseBackup(text: string): { backup: Backup; summary: BackupSummary } | { error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: 'Il file non è un JSON valido.' }; }
  const b = raw as Partial<Backup>;
  if (!b || b.app !== 'programma-nutrizionale') return { error: 'Non è un backup di Programma Nutrizionale.' };
  if (b.version !== 2) return { error: `Versione del backup non supportata (${String(b.version)}).` };
  const arrays = ['foods', 'plans', 'mealLogs', 'weights', 'legacyWeeks'] as const;
  for (const k of arrays) if (!Array.isArray(b[k])) return { error: `Nel backup manca "${k}".` };
  if (!b.settings || typeof b.settings !== 'object') return { error: 'Nel backup mancano le impostazioni.' };
  if (b.plans!.some((p) => !Array.isArray(p.days) || p.days.length !== 7)) return { error: 'Un piano nel backup non ha 7 giorni.' };
  const backup = b as Backup;
  return {
    backup,
    summary: { plans: backup.plans.length, foods: backup.foods.length, mealLogs: backup.mealLogs.length, weights: backup.weights.length, exportedAt: backup.exportedAt },
  };
}

export async function restoreBackup(db: AppDb, b: Backup) {
  await db.transaction('rw', [db.foods, db.plans, db.mealLogs, db.weights, db.legacyWeeks, db.settings], async () => {
    await Promise.all([db.foods.clear(), db.plans.clear(), db.mealLogs.clear(), db.weights.clear(), db.legacyWeeks.clear(), db.settings.clear()]);
    await db.foods.bulkPut(b.foods);
    await db.plans.bulkPut(b.plans);
    await db.mealLogs.bulkPut(b.mealLogs);
    await db.weights.bulkPut(b.weights);
    await db.legacyWeeks.bulkPut(b.legacyWeeks);
    await db.settings.put({ key: 'settings', ...b.settings, migratedFromV1: true });
  });
}

export function backupFileName(now = new Date()): string {
  return `programma-nutrizionale-${now.toISOString().slice(0, 10)}.json`;
}
