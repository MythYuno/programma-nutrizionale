import type { Food, Plan } from './types';
import { SLOTS, SLOT_LABEL } from './types';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export interface PlanIssue {
  day: number;
  mealIndex: number | null;
  itemIndex: number | null;
  message: string;
}

export function validatePlan(plan: Plan, foods: readonly Food[]): PlanIssue[] {
  const ids = new Set(foods.map((f) => f.id));
  const issues: PlanIssue[] = [];
  if (!plan.name.trim()) issues.push({ day: 0, mealIndex: null, itemIndex: null, message: 'Il piano non ha un nome.' });
  if (plan.days.length !== 7) {
    issues.push({ day: 0, mealIndex: null, itemIndex: null, message: 'Il piano deve avere 7 giorni.' });
    return issues;
  }
  plan.days.forEach((day, d) => {
    const seen = new Set<string>();
    day.meals.forEach((meal, m) => {
      const where = `${DAY_NAMES[d]}, ${SLOT_LABEL[meal.slot] ?? meal.slot}`;
      if (!SLOTS.includes(meal.slot)) issues.push({ day: d, mealIndex: m, itemIndex: null, message: `${where}: fascia sconosciuta.` });
      if (seen.has(meal.slot)) issues.push({ day: d, mealIndex: m, itemIndex: null, message: `${where}: fascia ripetuta.` });
      seen.add(meal.slot);
      if (!meal.items.length) issues.push({ day: d, mealIndex: m, itemIndex: null, message: `${where}: nessun alimento.` });
      meal.items.forEach((it, i) => {
        if (!ids.has(it.foodId)) issues.push({ day: d, mealIndex: m, itemIndex: i, message: `${where}: alimento non nel catalogo.` });
        if (!(it.grams > 0)) issues.push({ day: d, mealIndex: m, itemIndex: i, message: `${where}: grammi mancanti.` });
        if (it.subs.some((s) => !ids.has(s.foodId) || !(s.grams > 0)))
          issues.push({ day: d, mealIndex: m, itemIndex: i, message: `${where}: uno scambio è incompleto.` });
        if (repeatedSub(it.foodId, it.subs))
          issues.push({ day: d, mealIndex: m, itemIndex: i, message: `${where}: uno scambio è ripetuto.` });
      });
    });
  });
  return issues;
}

export { DAY_NAMES };

// Il primo scambio che ripete un altro scambio o l'alimento stesso; null se non ce ne sono.
export function repeatedSub(foodId: string, subs: readonly { foodId: string }[]): string | null {
  const seen = new Set([foodId]);
  for (const s of subs) {
    if (seen.has(s.foodId)) return s.foodId;
    seen.add(s.foodId);
  }
  return null;
}

// Toglie dal piano tutto quello che non ha scritto il medico (titoli dei piatti,
// note, preparazioni delle versioni precedenti): restano fasce, alimenti e scambi.
export function stripRecipes(plan: Plan): Plan {
  return {
    ...plan,
    days: plan.days.map((d) => ({ meals: d.meals.map((m) => ({ slot: m.slot, items: m.items })) })),
  };
}
