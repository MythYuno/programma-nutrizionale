import type { Food, Macro, Meal, Portion } from './types';

export const ZERO: Macro = { kcal: 0, p: 0, c: 0, f: 0 };

export type FoodIndex = ReadonlyMap<string, Food>;

export function indexFoods(foods: readonly Food[]): FoodIndex {
  return new Map(foods.map((f) => [f.id, f]));
}

export function add(a: Macro, b: Macro): Macro {
  return { kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f };
}

// Valori non arrotondati: si arrotonda solo quando si mostra, altrimenti la
// somma di un giorno accumula l'errore di ogni alimento.
export function portionMacro(portion: Portion, foods: FoodIndex): Macro {
  const food = foods.get(portion.foodId);
  if (!food) return ZERO;
  const k = portion.grams / 100;
  return { kcal: food.per100.kcal * k, p: food.per100.p * k, c: food.per100.c * k, f: food.per100.f * k };
}

export function mealMacro(meal: Meal, foods: FoodIndex): Macro {
  return meal.items.reduce((acc, it) => add(acc, portionMacro(it, foods)), ZERO);
}

export function sumMacro(meals: readonly Meal[], foods: FoodIndex): Macro {
  return meals.reduce((acc, m) => add(acc, mealMacro(m, foods)), ZERO);
}

export function rounded(m: Macro): Macro {
  return { kcal: Math.round(m.kcal), p: Math.round(m.p), c: Math.round(m.c), f: Math.round(m.f) };
}

export function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('it-IT');
}

export function fmtGrams(g: number): string {
  const r = Math.round(g);
  if (r >= 1000) return (r / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' kg';
  return r + ' g';
}
