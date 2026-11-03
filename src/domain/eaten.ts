// Quello che si è mangiato davvero di un pasto del piano: lo scambio del medico
// scelto e i grammi reali, giorno per giorno. Il piano resta com'è.
import type { ItemLog, Macro, Meal, PlanItem } from './types';
import { add, portionMacro, ZERO, type FoodIndex } from './nutrition';

export interface EatenItem {
  index: number;
  foodId: string;
  grams: number;
  planFoodId: string;
  planGrams: number;
  swapped: boolean; // alimento diverso dal piano (uno scambio)
  changed: boolean; // grammi diversi da quelli previsti per l'alimento scelto
}

// Grammi previsti per l'alimento del piano o per uno dei suoi scambi.
export function choiceGrams(item: PlanItem, foodId: string): number | null {
  if (foodId === item.foodId) return item.grams;
  return item.subs.find((s) => s.foodId === foodId)?.grams ?? null;
}

export function eatenItems(meal: Meal, logs: readonly ItemLog[], date: string): EatenItem[] {
  return meal.items.map((item, index) => {
    const l = logs.find((x) => x.date === date && x.slot === meal.slot && x.index === index && x.planFoodId === item.foodId);
    const foodId = l && choiceGrams(item, l.foodId) !== null ? l.foodId : item.foodId;
    const grams = l ? l.grams : item.grams;
    return {
      index, foodId, grams, planFoodId: item.foodId, planGrams: item.grams,
      swapped: foodId !== item.foodId,
      changed: grams !== choiceGrams(item, foodId),
    };
  });
}

export function eatenMealMacro(meal: Meal, logs: readonly ItemLog[], date: string, foods: FoodIndex): Macro {
  return eatenItems(meal, logs, date).reduce((acc, e) => add(acc, portionMacro({ foodId: e.foodId, grams: e.grams }, foods)), ZERO);
}
