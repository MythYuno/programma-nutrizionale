import type { Food, FoodSource } from './types';

// Catalogo iniziale. Valori per 100 g di parte edibile a crudo:
// [id, nome, categoria, kcal, proteine, carboidrati, grassi, fonte, alias].
// Sono gli stessi valori della v1: stime da tabelle di composizione pubbliche
// (CREA e equivalenti), non i calcoli del medico. Variano con marca, taglio e
// cottura. Gli alias servono a riconoscere i nomi scritti nel piano v1.
type Row = [string, string, string, number, number, number, number, FoodSource, string[]?];

const T: FoodSource = 'tabelle';
const E: FoodSource = 'etichetta';

const ROWS: Row[] = [
  // Cereali e derivati
  ['pasta-semola', 'Pasta di semola', 'Cereali', 353, 11, 74, 1.4, T, ['pasta o riso', 'pasta']],
  ['pasta-uovo', 'Pasta all’uovo', 'Cereali', 366, 13, 71, 3.5, T, ["pasta all'uovo"]],
  ['riso', 'Riso', 'Cereali', 332, 6.7, 80, 0.4, T],
  ['orzo', 'Orzo', 'Cereali', 319, 10.4, 71, 1.4, T],
  ['farro', 'Farro', 'Cereali', 335, 15, 67, 2.5, T],
  ['cous-cous', 'Cous cous', 'Cereali', 358, 12, 72, 1.5, T],
  ['quinoa', 'Quinoa', 'Cereali', 368, 14, 64, 6, T],
  ['avena', 'Fiocchi d’avena', 'Cereali', 367, 12.6, 63, 7, T, ['avena']],
  ['pane-integrale', 'Pane integrale', 'Pane e sostituti', 224, 7.5, 48.5, 1.3, T, ['pane']],
  ['pan-bauletto', 'Pan bauletto bianco', 'Pane e sostituti', 224, 7.5, 48.5, 1.3, E, ['pan bauletto bianco']],
  ['wasa', 'Wasa', 'Pane e sostituti', 224, 7.5, 48.5, 1.3, E],
  ['crackers', 'Crackers', 'Pane e sostituti', 428, 10, 80, 8, E],
  ['grissini', 'Grissini', 'Pane e sostituti', 428, 10, 80, 8, E],
  ['patate', 'Patate', 'Tuberi', 85, 2.1, 18, 1, T],
  // Colazione
  ['cereali', 'Cereali da colazione', 'Colazione', 370, 8, 80, 2.5, E, ['cereali']],
  ['corn-flakes', 'Corn flakes', 'Colazione', 370, 8, 80, 2.5, E],
  ['muesli', 'Muesli', 'Colazione', 370, 8, 80, 2.5, E],
  ['frollini', 'Frollini', 'Colazione', 416, 7, 73, 11, E],
  ['biscotti', 'Biscotti', 'Colazione', 416, 7, 73, 11, E],
  ['cioccolato-fondente', 'Cioccolato fondente', 'Colazione', 515, 5, 50, 33, E],
  ['marmellata', 'Marmellata', 'Colazione', 222, 0.5, 55, 0.1, E],
  // Latte e derivati
  ['latte-ps', 'Latte parzialmente scremato', 'Latte e yogurt', 46, 3.3, 5, 1.5, T, ['latte p.s.', 'latte']],
  ['kefir', 'Kefir', 'Latte e yogurt', 46, 3.3, 5, 1.5, T],
  ['yogurt-2', 'Yogurt 2%', 'Latte e yogurt', 66, 3.8, 4.3, 3.9, T],
  ['yogurt-intero', 'Yogurt intero', 'Latte e yogurt', 66, 3.8, 4.3, 3.9, T],
  ['yogurt-greco', 'Yogurt greco 0%', 'Latte e yogurt', 59, 10, 4, 0.4, T, ['skyr']],
  ['mozzarella', 'Mozzarella', 'Formaggi', 253, 18.7, 0.7, 19.5, T],
  ['feta', 'Feta', 'Formaggi', 250, 14, 4, 21, T],
  ['grana', 'Grana', 'Formaggi', 384, 33, 0, 28, T, ['parmigiano']],
  ['ricotta', 'Ricotta', 'Formaggi', 146, 8.8, 3.5, 10.9, T],
  ['stracchino', 'Stracchino', 'Formaggi', 300, 18, 1, 25, T],
  ['formaggio-molle', 'Formaggio molle', 'Formaggi', 300, 18, 1, 25, T],
  // Carne, pesce, uova
  ['pollo', 'Pollo', 'Carne', 100, 23.3, 0, 0.8, T],
  ['pollo-petto', 'Petto di pollo', 'Carne', 100, 23.3, 0, 0.8, T, ['pollo petto']],
  ['pollo-coscia', 'Coscia di pollo', 'Carne', 100, 23.3, 0, 0.8, T, ['coscia']],
  ['tacchino', 'Petto di tacchino', 'Carne', 100, 23.3, 0, 0.8, T],
  ['manzo-magro', 'Manzo magro', 'Carne', 122, 21, 0, 4, T],
  ['manzo-tritato', 'Manzo magro tritato', 'Carne', 122, 21, 0, 4, T],
  ['cavallo', 'Cavallo', 'Carne', 122, 21, 0, 4, T],
  ['bresaola', 'Bresaola', 'Carne', 151, 32, 0, 2.6, T],
  ['merluzzo', 'Merluzzo', 'Pesce', 71, 17, 0, 0.3, T],
  ['salmone', 'Salmone', 'Pesce', 185, 20, 0, 12, T],
  ['salmone-affumicato', 'Salmone affumicato', 'Pesce', 147, 25, 0, 4.5, T],
  ['tonno-sgocciolato', 'Tonno sgocciolato', 'Pesce', 192, 25.2, 0, 10, T],
  ['pesce-azzurro', 'Pesce azzurro', 'Pesce', 170, 19, 0, 10, T],
  ['gamberetti', 'Gamberetti', 'Pesce', 71, 15, 1, 0.8, T],
  ['vongole', 'Vongole', 'Pesce', 71, 15, 1, 0.8, T],
  ['cozze', 'Cozze', 'Pesce', 71, 15, 1, 0.8, T],
  ['polpo', 'Polpo', 'Pesce', 71, 15, 1, 0.8, T],
  ['uova', 'Uova', 'Uova', 128, 12.4, 0, 8.7, T],
  ['tofu', 'Tofu', 'Vegetale proteico', 76, 8, 1.9, 4.8, T],
  // Legumi
  ['lenticchie-scatola', 'Lenticchie in scatola', 'Legumi', 100, 7, 14, 1.5, T, ['lenticchie scatola']],
  ['ceci-scatola', 'Ceci in scatola', 'Legumi', 100, 7, 14, 1.5, T, ['ceci scatola']],
  ['fagioli-scatola', 'Fagioli in scatola', 'Legumi', 100, 7, 14, 1.5, T, ['fagioli scatola']],
  ['legumi-scatola', 'Legumi in scatola', 'Legumi', 100, 7, 14, 1.5, T, ['legumi scatola']],
  ['lenticchie-secche', 'Lenticchie secche', 'Legumi', 291, 23, 51, 2, T],
  ['ceci-secchi', 'Ceci secchi', 'Legumi', 291, 23, 51, 2, T],
  ['fagioli-secchi', 'Fagioli secchi', 'Legumi', 291, 23, 51, 2, T],
  ['legumi-secchi', 'Legumi secchi', 'Legumi', 291, 23, 51, 2, T],
  // Frutta e verdura
  ['frutta', 'Frutta fresca', 'Frutta', 45, 0.6, 10, 0.2, T, ['frutta']],
  ['frutta-secca', 'Frutta secca', 'Frutta', 600, 18, 8, 55, T, ['frutta secca/oleosa']],
  ['verdure', 'Verdure', 'Verdure', 25, 2, 3.5, 0.3, T],
  ['verdure-crude', 'Verdure crude', 'Verdure', 25, 2, 3.5, 0.3, T],
  ['pomodori', 'Pomodori', 'Verdure', 19, 1, 3.5, 0.2, T],
  // Condimenti
  ['olio-evo', 'Olio EVO', 'Condimenti', 899, 0, 0, 99.9, T, ['olio']],
  ['pesto', 'Pesto genovese', 'Condimenti', 450, 5, 6, 45, E, ['pesto genovese']],
];

export const SEED_FOODS: Food[] = ROWS.map(([id, name, category, kcal, p, c, f, source]) => ({
  id, name, category, source, per100: { kcal, p, c, f },
}));

// "Uova (3)" → "uova"; "Tofu (+ salsa soia 10 g)" → "tofu".
export function normalizeName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').replace(/’/g, "'").trim().toLowerCase();
}

const BY_NAME = new Map<string, string>();
for (const [id, name, , , , , , , aliases] of ROWS) {
  BY_NAME.set(normalizeName(name), id);
  for (const a of aliases ?? []) BY_NAME.set(normalizeName(a), id);
}

export function findSeedFoodId(name: string): string | null {
  return BY_NAME.get(normalizeName(name)) ?? null;
}
