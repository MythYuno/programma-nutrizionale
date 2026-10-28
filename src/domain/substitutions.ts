// Alternative indicative: rapporti da tabelle di equivalenza pubbliche
// (petrininutrizione.it, Grana Padano Educazione Nutrizionale, melarossa.it).
// Non fanno parte del piano del medico e vanno verificate con lui.

export interface Alternative {
  name: string;
  grams: number;
  note: string;
}

type Rule = { re: RegExp; subs: [name: string, ratio: number, note: string][] };

const RULES: Rule[] = [
  { re: /pasta|riso|orzo|farro|cous|polenta/i, subs: [
    ['Riso, orzo o farro', 1, 'I cereali in chicco si scambiano 1:1 a crudo'],
    ['Quinoa o amaranto', 1, '1:1 a crudo, senza glutine e più proteici del riso'],
    ['Bulgur o cous cous', 1, '1:1 a crudo, pronti in 5 minuti'],
    ['Miglio o grano saraceno', 1, '1:1 a crudo, senza glutine'],
    ['Pane', 1.25, '80 g di pasta ≈ 100 g di pane'],
    ['Patate', 4, '50 g di pasta ≈ 210 g di patate']] },
  { re: /pane|cracker|grissini|bauletto|wasa|biscott|frollini/i, subs: [
    ['Pane di segale o integrale', 1, 'A pari peso, più fibra'],
    ['Gallette o Wasa', 1, 'A pari peso, comode da tenere in borsa'],
    ['Pasta o riso (a crudo)', 0.8, '100 g di pane ≈ 80 g di pasta'],
    ['Cous cous (a crudo)', 0.7, 'Stesso rapporto usato nel piano'],
    ['Patate', 3, '50 g di pane ≈ 150 g di patate']] },
  { re: /patate/i, subs: [
    ['Patate dolci', 1, 'A pari peso, indice glicemico più basso'],
    ['Pane', 0.33, '150 g di patate ≈ 50 g di pane'],
    ['Pasta o riso (a crudo)', 0.25, '210 g di patate ≈ 50 g di pasta']] },
  { re: /pollo|tacchino|cavallo|manzo|vitello|carne/i, subs: [
    ['Tacchino', 1.05, 'Praticamente equivalente al pollo'],
    ['Merluzzo o nasello', 1.33, '200 g di pollo ≈ 250–280 g di merluzzo'],
    ['Platessa o sogliola', 1.2, 'Pesce magro, cottura rapidissima'],
    ['Salmone', 0.68, '200 g di pollo ≈ 120–150 g di salmone'],
    ['Gamberi o gamberetti', 1.3, 'A pari proteine, molto magri'],
    ['Ricotta o mozzarella', 0.55, 'Formaggi freschi, a pari proteine'],
    ['Seitan', 0.9, '25 g di proteine per 100 g: il più proteico dei vegetali'],
    ['Tempeh', 1.2, 'Circa 19 g di proteine per 100 g'],
    ['Tofu', 1.6, 'Circa 14 g di proteine per 100 g'],
    ['Legumi secchi', 0.25, 'Aggiungono però parecchi carboidrati'],
    ['Bresaola o prosciutto sgrassato', 0.3, 'Salumi magri, da limitare per il sale']] },
  { re: /merluzzo|nasello|sogliola|platessa|pesce|salmone|vongole|cozze|polpo|gamberetti|tonno/i, subs: [
    ['Altro pesce magro', 1, 'Merluzzo, nasello, platessa e orata si scambiano a pari peso'],
    ['Pollo o tacchino', 0.75, '250–280 g di merluzzo ≈ 200 g di pollo'],
    ['Gamberi o calamari', 1, 'A pari peso, stesso profilo magro'],
    ['Uova', 0.5, 'A pari proteine, circa 3 uova ogni 300 g di pesce magro'],
    ['Ricotta o mozzarella', 0.42, 'Formaggi freschi, a pari proteine'],
    ['Tofu', 0.8, 'Alternativa vegetale, meno proteica a pari peso']] },
  { re: /uova|uovo/i, subs: [
    ['Merluzzo o pesce magro', 2, '150 g di uova (3) ≈ 300 g di merluzzo'],
    ['Pollo o tacchino', 1.4, 'A pari proteine'],
    ['Gamberetti', 1.8, 'A pari proteine'],
    ['Ricotta o fiocchi di latte', 1.1, 'Alternativa vegetariana'],
    ['Tofu', 1.6, 'Alternativa vegetale, ottimo strapazzato']] },
  { re: /latte|kefir|yogurt/i, subs: [
    ['Yogurt bianco naturale', 0.75, '200 g di latte ≈ 150 g di yogurt'],
    ['Kefir', 0.75, 'Stesso rapporto dello yogurt, più fermenti'],
    ['Yogurt greco o skyr', 0.55, 'Più densi di proteine: ne serve meno'],
    ['Fiocchi di latte', 0.5, 'Versione salata, molto proteica'],
    ['Bevanda vegetale non zuccherata', 1, 'Attenzione: ha molte meno proteine del latte']] },
  { re: /lenticchie|ceci|fagioli|legumi|piselli/i, subs: [
    ['Altri legumi', 1, 'Ceci, fagioli, lenticchie, piselli e fave a pari peso'],
    ['Secchi ↔ in scatola', 0.4, 'I secchi pesano circa 2,5 volte meno di quelli in scatola'],
    ['Pasta di legumi', 0.45, 'Da ceci o lenticchie: comoda e proteica'],
    ['Tofu o tempeh', 0.7, 'Sempre da soia, con meno carboidrati']] },
  { re: /feta|ricotta|mozzarella|stracchino|formaggio|grana/i, subs: [
    ['Altro formaggio fresco', 1, 'Mozzarella, caciotta fresca e primo sale: 1:1'],
    ['Ricotta', 1.8, '50 g di mozzarella ≈ 90 g di ricotta'],
    ['Fiocchi di latte', 1.2, 'Più magri e molto sazianti'],
    ['Grana o parmigiano', 0.45, 'Stagionati: più proteine e grassi a parità di peso'],
    ['Pollo o tacchino', 1.8, 'A pari proteine']] },
  { re: /frutta secca|oleosa|mandorle|noci/i, subs: [
    ['Altra frutta oleosa', 1, 'Mandorle, noci, nocciole, pistacchi e anacardi a pari peso'],
    ['Semi (girasole, zucca, lino)', 1, 'A pari peso, buoni sullo yogurt o in insalata']] },
  { re: /frutta/i, subs: [
    ['Altra frutta di stagione', 1, 'A pari peso, preferendo frutta non troppo zuccherina'],
    ['Frutti di bosco', 1, 'A pari peso, meno zuccheri della media']] },
  { re: /verdur|pomodor|insalata/i, subs: [
    ['Altra verdura a pari peso', 1, 'Zucchine, melanzane, broccoli, cavolfiore, cavoletti, carote, insalata'],
    ['Verdure surgelate', 1, 'Equivalenti alle fresche e già pulite'],
    ['Verdure grigliate o al vapore', 1, 'Stesso peso: cambia solo la cottura']] },
  { re: /pesto/i, subs: [
    ['Pesto di pistacchi o noci', 1, 'A pari peso, stesso ruolo di condimento grasso'],
    ['Crema di verdure frullate + olio', 1, 'Zucchine o piselli frullati, contando l’olio a parte']] },
  { re: /olio/i, subs: [
    ['Olio di semi di lino o noce', 1, 'A crudo, a pari peso'],
    ['Frutta secca tritata', 1, 'Stessa quota di grassi, ma con fibra e croccantezza']] },
  { re: /cioccolat/i, subs: [
    ['Cacao amaro in polvere', 0.5, 'Molto più concentrato: ne basta la metà'],
    ['Crema di frutta secca 100%', 0.7, 'Senza zuccheri aggiunti']] },
];

export const ALTERNATIVE_SOURCES = [
  { label: 'petrininutrizione.it', url: 'https://petrininutrizione.it/sostituire-riso-pasta-pane-patate/' },
  { label: 'Grana Padano — Educazione Nutrizionale', url: 'https://www.educazionenutrizionale.granapadano.it/it/stile-di-vita/tabelle-alimenti-equivalenti' },
  { label: 'melarossa.it', url: 'https://www.melarossa.it/dieta/dimagrire/abc-delle-sostituzioni-dei-cibi-la-guida-di-melarossa/' },
];

// Scarta l'alternativa che è lo stesso alimento ("Riso" non è un'alternativa
// al riso). Le voci "Altro…/Altra…" sono generiche apposta e restano.
function sameFood(food: string, alt: string): boolean {
  const a = food.toLowerCase();
  const b = alt.toLowerCase();
  if (/^altr/.test(b)) return false;
  return b.split(/[ ,()]/).filter((w) => w.length > 3).some((w) => a.includes(w));
}

export function roundTo5(g: number): number {
  return Math.round(g / 5) * 5;
}

export function alternativesFor(foodName: string, grams: number): Alternative[] {
  if (!(grams > 0)) return [];
  const rule = RULES.find((r) => r.re.test(foodName));
  if (!rule) return [];
  return rule.subs
    .filter(([name]) => !sameFood(foodName, name))
    .map(([name, ratio, note]) => ({ name, grams: roundTo5(grams * ratio), note }));
}
