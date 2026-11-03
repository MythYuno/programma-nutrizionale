// Catalogo degli sgarri: valori della v1, stime per porzioni tipiche
// (non sono calcoli del medico). Il testo dopo la virgola è la porzione.
import type { CatalogExtra, ExtraCategory, FoodIconName } from './types';

type Row = [id: string, label: string, kcal: number, p: number, c: number, f: number, icon: FoodIconName];

const ROWS: Record<ExtraCategory, Row[]> = {
  Alcolici: [
    ['birra33', 'Birra chiara 33 cl', 110, 1, 9, 0, 'beer'],
    ['birra40', 'Birra media 40 cl', 135, 1.2, 11, 0, 'beer'],
    ['birradm', 'Birra doppio malto 33 cl', 280, 2, 22, 0, 'beer'],
    ['vino', 'Bicchiere di vino 125 ml', 90, 0, 1, 0, 'wine'],
    ['spritz', 'Spritz', 170, 0, 16, 0, 'cocktail'],
    ['amaro', 'Amaro o superalcolico 40 ml', 95, 0, 4, 0, 'tumbler'],
  ],
  Dolci: [
    ['gelato', 'Gelato in coppetta, 2 gusti', 260, 4, 32, 12, 'ice-cream'],
    ['cono', 'Cono gelato', 300, 5, 36, 15, 'soft-ice-cream'],
    ['tiramisu', 'Tiramisù, una porzione', 350, 6, 32, 21, 'cake'],
    ['torta', 'Fetta di torta', 320, 4, 42, 15, 'cake'],
    ['ciocc', 'Cioccolato 25 g', 130, 1, 12, 8, 'chocolate'],
    ['cornetto', 'Cornetto semplice', 300, 6, 40, 13, 'croissant'],
    ['cornettof', 'Cornetto farcito', 400, 6, 50, 19, 'croissant'],
  ],
  Salato: [
    ['pizza', 'Pizza margherita intera', 900, 35, 120, 30, 'pizza'],
    ['trancio', 'Trancio di pizza', 300, 12, 40, 10, 'pizza'],
    ['patatine', 'Patatine fritte, porzione', 470, 5, 55, 25, 'fries'],
    ['burger', 'Hamburger semplice', 500, 25, 40, 25, 'hamburger'],
    ['panino', 'Panino con salumi', 450, 20, 45, 21, 'sandwich'],
    ['busta', 'Patatine in busta 50 g', 270, 3, 25, 17, 'potato'],
    ['aperitivo', 'Aperitivo con stuzzichini', 450, 10, 45, 25, 'cheers'],
  ],
};

export const EXTRAS_CATALOG: readonly CatalogExtra[] = (Object.keys(ROWS) as ExtraCategory[]).flatMap((category) =>
  ROWS[category].map(([id, label, kcal, p, c, f, icon]) => {
    const [name, portion = ''] = label.split(', ');
    return { id, name: name!, portion, category, macro: { kcal, p, c, f }, icon };
  }),
);
