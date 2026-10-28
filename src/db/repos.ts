import type { AppDb } from './schema';
import type { Food, MealLog, Plan, Settings, Slot, Weight } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';

export async function getSettings(db: AppDb): Promise<Settings> {
  const row = await db.settings.get('settings');
  if (!row) return { ...DEFAULT_SETTINGS };
  const { key: _k, ...s } = row;
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function updateSettings(db: AppDb, patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings(db)), ...patch };
  await db.settings.put({ key: 'settings', ...next });
  return next;
}

export async function activePlan(db: AppDb): Promise<Plan | null> {
  const { activePlanId } = await getSettings(db);
  return activePlanId ? ((await db.plans.get(activePlanId)) ?? null) : null;
}

export function savePlan(db: AppDb, plan: Plan) {
  // $state di Svelte usa dei Proxy: IndexedDB vuole oggetti semplici.
  return db.plans.put($plain(plan));
}

export function saveFood(db: AppDb, food: Food) {
  return db.foods.put($plain(food));
}

export async function setMealDone(db: AppDb, log: MealLog, done: boolean) {
  if (done) await db.mealLogs.put(log);
  else await db.mealLogs.delete([log.date, log.slot]);
}

export function logsBetween(db: AppDb, from: string, to: string) {
  return db.mealLogs.where('date').between(from, to, true, true).toArray();
}

export function putWeight(db: AppDb, w: Weight) {
  return db.weights.put(w);
}

export function deleteWeight(db: AppDb, date: string) {
  return db.weights.delete(date);
}

// Gli id dei pasti usati dal piano: un alimento usato non si può eliminare.
export function mealsUsingFood(plans: readonly Plan[], foodId: string): { day: number; slot: Slot }[] {
  const out: { day: number; slot: Slot }[] = [];
  for (const p of plans)
    p.days.forEach((d, i) => d.meals.forEach((m) => {
      if (m.items.some((it) => it.foodId === foodId || it.subs.some((s) => s.foodId === foodId))) out.push({ day: i, slot: m.slot });
    }));
  return out;
}

function $plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
