// Stato condiviso dell'app. I dati di una persona sola stanno comodamente in
// memoria: si carica tutto all'avvio e si scrive su IndexedDB a ogni modifica.
import { db } from '../db/schema';
import * as repo from '../db/repos';
import { ensureStartup, requestPersistence } from '../db/migrate';
import type { Food, LegacyWeek, MealLog, Plan, Settings, Slot, Weight } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';
import { indexFoods } from '../domain/nutrition';
import { doneSlots, isoDate, minutesOf } from '../domain/schedule';
import { upsertWeight } from '../domain/weight';
import { freeSlots } from '../domain/extras';

class AppState {
  ready = $state(false);
  today = $state(isoDate(new Date()));
  minutes = $state(minutesOf(new Date())); // l'ora di quando si è aperta l'app
  foods = $state<Food[]>([]);
  plan = $state<Plan | null>(null);
  logs = $state<MealLog[]>([]);
  weights = $state<Weight[]>([]);
  legacyWeeks = $state<LegacyWeek[]>([]);
  settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  notices = $state<string[]>([]);
  persisted = $state(false);

  foodIndex = $derived(indexFoods(this.foods));

  private loaders: (() => Promise<void>)[] = [];

  // Gli stati che dipendono da app si registrano qui (evita un import circolare).
  onLoad(loader: () => Promise<void>) {
    this.loaders.push(loader);
  }

  async load() {
    const report = await ensureStartup(db, safeLocalStorage());
    this.notices = report.warnings;
    [this.foods, this.logs, this.weights, this.legacyWeeks, this.settings, this.plan] = await Promise.all([
      db.foods.toArray(), db.mealLogs.toArray(), db.weights.toArray(), db.legacyWeeks.toArray(),
      repo.getSettings(db), repo.activePlan(db),
    ]);
    // Gli altri stati (fuori piano, scambi) si caricano qui, prima di "pronta":
    // così Oggi non mostra mai un totale senza le loro voci.
    await Promise.all(this.loaders.map((l) => l()));
    this.persisted = await requestPersistence();
    this.ready = true;
  }

  // Solo alla riapertura: il pasto aperto non deve cambiare mentre lo si legge.
  refreshToday() {
    this.today = isoDate(new Date());
    this.minutes = minutesOf(new Date());
  }

  done(date: string): Set<Slot> {
    return doneSlots(this.logs, date);
  }

  // Pasti segnati come liberi: contano come fatti, ma non nel totale del piano.
  frees(date: string): Set<Slot> {
    return freeSlots(this.logs, date);
  }

  async toggleMeal(date: string, slot: Slot) {
    if (!this.plan) return;
    const isDone = this.done(date).has(slot);
    const log = { date, slot, planId: this.plan.id };
    this.logs = isDone ? this.logs.filter((l) => !(l.date === date && l.slot === slot)) : [...this.logs, log];
    await repo.setMealDone(db, log, !isDone);
  }

  async addWeight(w: Weight) {
    this.weights = upsertWeight(this.weights, w);
    await repo.putWeight(db, w);
  }

  async removeWeight(date: string) {
    this.weights = this.weights.filter((w) => w.date !== date);
    await repo.deleteWeight(db, date);
  }

  async savePlan(plan: Plan) {
    await repo.savePlan(db, plan);
    this.settings = await repo.updateSettings(db, { activePlanId: plan.id });
    this.plan = structuredClone($state.snapshot(plan));
  }

  async saveFood(food: Food) {
    await repo.saveFood(db, food);
    this.foods = [...this.foods.filter((f) => f.id !== food.id), food];
  }

  async deleteFood(id: string) {
    await db.foods.delete(id);
    this.foods = this.foods.filter((f) => f.id !== id);
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = await repo.updateSettings(db, patch);
  }

  async reload() {
    this.ready = false;
    await this.load();
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const app = new AppState();
