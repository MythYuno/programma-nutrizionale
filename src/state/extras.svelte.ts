// Stato delle voci fuori piano e del pasto libero. Separato da app.svelte.ts:
// qui si scrive solo quello che l'utente aggiunge fuori dal piano del medico.
import { db } from '../db/schema';
import * as repo from '../db/repos';
import type { CustomItem, ExtraLog, Macro, Slot } from '../domain/types';
import { newExtra, type ExtraChoice } from '../domain/extras';
import { app } from './app.svelte';

const uid = () => crypto.randomUUID();

class ExtrasState {
  extras = $state<ExtraLog[]>([]);
  customItems = $state<CustomItem[]>([]);

  async load() {
    [this.extras, this.customItems] = await Promise.all([db.extras.toArray(), db.customItems.toArray()]);
  }

  forDate(date: string): ExtraLog[] {
    return this.extras.filter((e) => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // La stessa voce del catalogo o tua, nello stesso pasto dello stesso giorno,
  // diventa "×2" invece di una riga in più.
  async add(choice: ExtraChoice, date: string, opts: { freeSlot: Slot | null; grams?: number }): Promise<ExtraLog> {
    if (choice.kind !== 'alimento') {
      const same = this.extras.find((e) => e.date === date && e.origin === choice.kind && e.refId === choice.item.id && e.freeSlot === opts.freeSlot);
      if (same) {
        await this.setQty(same.id, same.qty + 1);
        return this.extras.find((e) => e.id === same.id)!;
      }
    }
    const e = newExtra(choice, date, { id: uid(), now: new Date(), ...opts }, app.foodIndex);
    return this.put(e);
  }

  async addManual(input: { name: string; portion: string; macro: Macro }, date: string, opts: { freeSlot: Slot | null; save: boolean }): Promise<ExtraLog> {
    const name = input.name.trim();
    const now = new Date().toISOString();
    let refId: string | null = null;
    if (opts.save) {
      const item: CustomItem = { id: uid(), name, portion: input.portion.trim(), macro: { ...input.macro }, createdAt: now };
      this.customItems = [...this.customItems, item];
      await repo.putCustomItem(db, item);
      refId = item.id;
    }
    return this.put({
      id: uid(), date, name, portion: input.portion.trim(), qty: 1, macro: { ...input.macro },
      origin: opts.save ? 'mia' : 'manuale', refId, grams: null, freeSlot: opts.freeSlot, createdAt: now,
    });
  }

  async setQty(id: string, qty: number) {
    const e = this.extras.find((x) => x.id === id);
    if (!e || qty < 1) return;
    await this.put({ ...e, qty });
  }

  async remove(id: string): Promise<ExtraLog | null> {
    const e = this.extras.find((x) => x.id === id) ?? null;
    if (!e) return null;
    this.extras = this.extras.filter((x) => x.id !== id);
    await repo.deleteExtra(db, id);
    return e;
  }

  async restore(e: ExtraLog) {
    await this.put(e);
  }

  async saveCustom(item: CustomItem) {
    this.customItems = [...this.customItems.filter((x) => x.id !== item.id), item];
    await repo.putCustomItem(db, item);
  }

  async deleteCustom(id: string) {
    this.customItems = this.customItems.filter((x) => x.id !== id);
    await repo.deleteCustomItem(db, id);
  }

  async markFree(date: string, slot: Slot) {
    const log = { date, slot, planId: app.plan?.id ?? '', kind: 'libero' as const };
    app.logs = [...app.logs.filter((l) => !(l.date === date && l.slot === slot)), log];
    await repo.putMealLog(db, log);
  }

  // Il pasto torna da fare; quello che ci si era scritto resta, come sgarro.
  async unmarkFree(date: string, slot: Slot) {
    app.logs = app.logs.filter((l) => !(l.date === date && l.slot === slot));
    await repo.setMealDone(db, { date, slot, planId: app.plan?.id ?? '' }, false);
    for (const e of this.extras.filter((x) => x.date === date && x.freeSlot === slot)) await this.put({ ...e, freeSlot: null });
  }

  private async put(e: ExtraLog): Promise<ExtraLog> {
    this.extras = [...this.extras.filter((x) => x.id !== e.id), e];
    await repo.putExtra(db, e);
    return e;
  }
}

export const extrasState = new ExtrasState();
