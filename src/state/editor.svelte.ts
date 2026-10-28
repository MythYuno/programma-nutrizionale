// Bozza del piano in modifica. Vive fuori dai componenti così cambiare scheda
// non butta via le modifiche; il piano attivo cambia solo con save().
import { app } from './app.svelte';
import type { Meal, Plan, PlanItem, Slot } from '../domain/types';
import { SLOTS } from '../domain/types';
import { validatePlan, type PlanIssue } from '../domain/validate';
import { sortMeals, mondayOf } from '../domain/schedule';

function emptyPlan(): Plan {
  return { id: 'piano-' + Date.now(), name: 'Il mio piano', startDate: mondayOf(app.today), days: Array.from({ length: 7 }, () => ({ meals: [] })) };
}

class Editor {
  draft = $state<Plan | null>(null);
  dirty = $state(false);
  day = $state(0);
  issues = $state<PlanIssue[]>([]);

  ensure() {
    if (!this.draft) this.reset();
  }

  reset() {
    this.draft = app.plan ? structuredClone($state.snapshot(app.plan)) : emptyPlan();
    this.dirty = false;
    this.issues = [];
  }

  touch() {
    this.dirty = true;
    if (this.issues.length && this.draft) this.issues = validatePlan(this.draft, app.foods);
  }

  async save(): Promise<boolean> {
    if (!this.draft) return false;
    this.issues = validatePlan(this.draft, app.foods);
    if (this.issues.length) {
      this.day = this.issues[0]!.day;
      return false;
    }
    await app.savePlan(this.draft);
    this.dirty = false;
    return true;
  }

  get meals(): Meal[] {
    return this.draft?.days[this.day]?.meals ?? [];
  }

  missingSlots(): Slot[] {
    const used = new Set(this.meals.map((m) => m.slot));
    return SLOTS.filter((s) => !used.has(s));
  }

  addMeal(slot: Slot) {
    const d = this.draft?.days[this.day];
    if (!d) return;
    d.meals = sortMeals([...d.meals, { slot, title: '', note: '', items: [] }]);
    this.touch();
  }

  removeMeal(slot: Slot) {
    const d = this.draft?.days[this.day];
    if (!d) return;
    d.meals = d.meals.filter((m) => m.slot !== slot);
    this.touch();
  }

  meal(slot: Slot): Meal | undefined {
    return this.meals.find((m) => m.slot === slot);
  }

  // index < 0 aggiunge in fondo
  setItem(slot: Slot, index: number, item: PlanItem) {
    const m = this.meal(slot);
    if (!m) return;
    if (index >= 0) m.items[index] = item;
    else m.items.push(item);
    this.touch();
  }

  removeItem(slot: Slot, index: number) {
    this.meal(slot)?.items.splice(index, 1);
    this.touch();
  }

  moveItem(slot: Slot, index: number, delta: number) {
    const m = this.meal(slot);
    const j = index + delta;
    if (!m || j < 0 || j >= m.items.length) return;
    const [it] = m.items.splice(index, 1);
    m.items.splice(j, 0, it!);
    this.touch();
  }

  // Colazione e spuntini spesso sono uguali tutta la settimana.
  applyMealToAllDays(slot: Slot) {
    const src = this.meals.find((m) => m.slot === slot);
    if (!src || !this.draft) return;
    const copy = $state.snapshot(src);
    this.draft.days.forEach((d, i) => {
      if (i === this.day) return;
      d.meals = sortMeals([...d.meals.filter((m) => m.slot !== slot), structuredClone(copy)]);
    });
    this.touch();
  }

  copyDayTo(targets: number[]) {
    if (!this.draft) return;
    const src = $state.snapshot(this.draft.days[this.day]!);
    for (const t of targets) if (t !== this.day) this.draft.days[t] = structuredClone(src);
    this.touch();
  }
}

export const editor = new Editor();
