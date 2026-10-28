import Dexie, { type EntityTable } from 'dexie';
import type { Food, LegacyWeek, MealLog, Plan, Settings, Weight } from '../domain/types';

export type SettingsRow = Settings & { key: 'settings' };

export class AppDb extends Dexie {
  foods!: EntityTable<Food, 'id'>;
  plans!: EntityTable<Plan, 'id'>;
  mealLogs!: Dexie.Table<MealLog, [string, string]>;
  weights!: EntityTable<Weight, 'date'>;
  legacyWeeks!: EntityTable<LegacyWeek, 'week'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor(name = 'programma-nutrizionale') {
    super(name);
    this.version(1).stores({
      foods: 'id, name',
      plans: 'id',
      mealLogs: '[date+slot], date',
      weights: 'date',
      legacyWeeks: 'week',
      settings: 'key',
    });
  }
}

export const db = new AppDb();
