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
  kind?: 'libero'; // assente = pasto del piano (i dati esistenti restano validi)
}

// --- Fuori piano -----------------------------------------------------------

// Origine di una voce fuori piano.
export type ExtraOrigin = 'catalogo' | 'mia' | 'alimento' | 'manuale';

export type ExtraCategory = 'Dolci' | 'Alcolici' | 'Salato';

// Nomi dei file in public/emoji/ (Fluent Emoji 3D).
export type FoodIconName =
  | 'beer' | 'wine' | 'cocktail' | 'tumbler' | 'ice-cream' | 'soft-ice-cream' | 'cake' | 'chocolate'
  | 'croissant' | 'pizza' | 'fries' | 'hamburger' | 'sandwich' | 'potato' | 'cheers'
  | 'bookmark' | 'plate' | 'pencil';

// Voce del catalogo degli sgarri, a porzione intera.
export interface CatalogExtra {
  id: string;
  name: string;
  portion: string;
  category: ExtraCategory;
  macro: Macro;
  icon: FoodIconName;
}

// Voce propria salvata e riutilizzabile.
export interface CustomItem {
  id: string;
  name: string;
  portion: string; // descrizione libera, '' se assente (es. "1 barretta")
  macro: Macro; // kcal sempre presente; p/c/f a 0 se non indicati
  createdAt: string; // ISO
}

// Voce mangiata in un giorno. I valori sono copiati al momento:
// modificare o eliminare la voce d'origine non cambia i giorni passati.
export interface ExtraLog {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  portion: string; // es. "2 gusti", "40 g", ''
  qty: number; // >= 1, per voci ripetute (×2)
  macro: Macro; // valori di UNA porzione
  origin: ExtraOrigin;
  refId: string | null; // id del catalogo, della CustomItem o del Food
  grams: number | null; // solo per origin 'alimento'
  freeSlot: Slot | null; // pasto libero a cui appartiene, null = sgarro
  createdAt: string;
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
