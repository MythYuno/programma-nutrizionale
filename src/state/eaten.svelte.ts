// Stato degli scambi e dei grammi reali: cosa si è preso al posto degli
// alimenti del piano, giorno per giorno. Il piano non cambia.
import { db } from '../db/schema';
import * as repo from '../db/repos';
import type { ItemLog, PlanItem, Slot } from '../domain/types';
import { app } from './app.svelte';

class EatenState {
  itemLogs = $state<ItemLog[]>([]);

  async load() {
    this.itemLogs = await db.itemLogs.toArray();
  }

  forDate(date: string): ItemLog[] {
    return this.itemLogs.filter((l) => l.date === date);
  }

  // Un log uguale al piano non serve: si cancella.
  async set(date: string, slot: Slot, index: number, item: PlanItem, foodId: string, grams: number) {
    if (foodId === item.foodId && grams === item.grams) return this.reset(date, slot, index);
    const log: ItemLog = { date, slot, index, planFoodId: item.foodId, foodId, grams };
    this.itemLogs = [...this.without(date, slot, index), log];
    await repo.putItemLog(db, log);
  }

  async reset(date: string, slot: Slot, index: number) {
    this.itemLogs = this.without(date, slot, index);
    await repo.deleteItemLog(db, date, slot, index);
  }

  private without(date: string, slot: Slot, index: number) {
    return this.itemLogs.filter((l) => !(l.date === date && l.slot === slot && l.index === index));
  }
}

export const eatenState = new EatenState();
app.onLoad(() => eatenState.load());
