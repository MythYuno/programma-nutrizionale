// Modello dati della v2. Tutto il resto dell'app parla questi tipi.

export interface Macro {
  kcal: number;
  p: number; // proteine, g
  c: number; // carboidrati, g
  f: number; // grassi, g
}

// "tabelle": stima da tabelle di composizione pubbliche (CREA e equivalenti),
// "etichetta": media dei prodotti confezionati, "manuale": inserito da te.
export type FoodSource = 'tabelle' | 'etichetta' | 'manuale';

export interface Food {
  id: string;
  name: string;
  per100: Macro;
  category: string;
  source: FoodSource;
}

export interface Portion {
  foodId: string;
  grams: number;
}

export interface PlanItem extends Portion {
  subs: Portion[]; // scambi scritti dal medico
}

export const SLOTS = ['colazione', 'spuntinoMattino', 'pranzo', 'spuntinoPomeriggio', 'cena'] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABEL: Record<Slot, string> = {
  colazione: 'Colazione',
  spuntinoMattino: 'Spuntino mattino',
  pranzo: 'Pranzo',
  spuntinoPomeriggio: 'Spuntino pomeriggio',
  cena: 'Cena',
};

export interface Meal {
  slot: Slot;
  title: string;
  note: string;
  items: PlanItem[];
}

export interface Day {
  meals: Meal[];
}

export interface Plan {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  days: Day[]; // 7 giorni, indice 0 = lunedì
}

export interface MealLog {
  date: string; // YYYY-MM-DD
  slot: Slot;
  planId: string;
}

export interface Weight {
  date: string; // YYYY-MM-DD
  kg: number;
}

// Settimane archiviate dalla v1: c'è solo il conteggio, non i giorni.
export interface LegacyWeek {
  week: string; // YYYY-Www
  done: number;
  total: number;
  perSlot: number[];
}

export interface Settings {
  activePlanId: string | null;
  weightGoalKg: number | null;
  lastBackupAt: string | null;
  migratedFromV1: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  activePlanId: null,
  weightGoalKg: null,
  lastBackupAt: null,
  migratedFromV1: false,
};
