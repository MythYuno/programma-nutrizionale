import Dexie, { type EntityTable } from 'dexie';
import { stripRecipes } from '../domain/validate';
import type { CustomItem, ExtraLog, Food, ItemLog, LegacyWeek, MealLog, Plan, Settings, Weight } from '../domain/types';

export type SettingsRow = Settings & { key: 'settings' };

export class AppDb extends Dexie {
  foods!: EntityTable<Food, 'id'>;
  plans!: EntityTable<Plan, 'id'>;
  mealLogs!: Dexie.Table<MealLog, [string, string]>;
  weights!: EntityTable<Weight, 'date'>;
  legacyWeeks!: EntityTable<LegacyWeek, 'week'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  extras!: EntityTable<ExtraLog, 'id'>;
  customItems!: EntityTable<CustomItem, 'id'>;
  itemLogs!: Dexie.Table<ItemLog, [string, string, number]>;

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
    // Fuori piano: le tabelle della versione 1 restano come sono.
    this.version(2).stores({ extras: 'id, date', customItems: 'id, name' });
    // Il piano contiene solo gli alimenti del medico: via titoli e note dei pasti.
    this.version(3).stores({}).upgrade((tx) =>
      tx.table<Plan, string>('plans').toCollection().modify((p) => { Object.assign(p, stripRecipes(p)); }),
    );
    // Scambi e grammi reali, per giorno e per alimento del piano.
    this.version(4).stores({ itemLogs: '[date+slot+index], date' });
  }
}

export const db = new AppDb();
