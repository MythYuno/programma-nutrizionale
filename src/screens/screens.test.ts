import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { db } from '../db/schema';
import { app } from '../state/app.svelte';
import { editor } from '../state/editor.svelte';
import { extrasState } from '../state/extras.svelte';
import { EXTRAS_CATALOG } from '../domain/extras-catalog';
import DayView from './DayView.svelte';
import Peso from './Peso.svelte';
import Settimana from './Settimana.svelte';
import PlanEditor from './plan/PlanEditor.svelte';

// Un mercoledì: il piano v1 ha "Farro e lenticchie tiepido" a pranzo.
const DATE = '2026-10-28';

beforeEach(async () => {
  await db.delete();
  await db.open();
  localStorage.clear();
  editor.draft = null;
  await app.load();
  await extrasState.load();
  app.today = DATE;
});

// Senza le globali di Vitest la pulizia automatica non scatta: i componenti di
// un test resterebbero montati nel successivo.
afterEach(() => cleanup());

describe('Oggi', () => {
  it('mostra il primo pasto e lo segna come fatto', async () => {
    render(DayView, { date: DATE });
    expect(screen.getByRole('heading', { name: 'Colazione' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Fatto' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Spuntino mattino' })).toBeInTheDocument());
    expect(await db.mealLogs.get([DATE, 'colazione'])).toBeTruthy();
  });
});

describe('Peso', () => {
  it('registra una pesata con la virgola', async () => {
    render(Peso);
    await fireEvent.click(screen.getByRole('button', { name: 'Pesata' }));
    await fireEvent.input(screen.getByLabelText('Peso (kg)'), { target: { value: '78,4' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    await waitFor(async () => expect(await db.weights.get(DATE)).toEqual({ date: DATE, kg: 78.4 }));
  });
});

describe('Editor del piano', () => {
  it('aggiunge un alimento al pranzo e salva', async () => {
    editor.ensure();
    editor.day = 2;
    render(PlanEditor);
    const before = app.plan!.days[2]!.meals.find((m) => m.slot === 'pranzo')!.items.length;
    const addButtons = screen.getAllByRole('button', { name: 'Aggiungi alimento' });
    await fireEvent.click(addButtons[2]!); // colazione, spuntino, pranzo
    await fireEvent.input(screen.getByLabelText('Cerca alimento'), { target: { value: 'grana' } });
    await fireEvent.click(screen.getByRole('button', { name: /^Grana/ }));
    await fireEvent.input(screen.getByLabelText('Grammi'), { target: { value: '10' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    await waitFor(async () => {
      const saved = await db.plans.get(app.plan!.id);
      const pranzo = saved!.days[2]!.meals.find((m) => m.slot === 'pranzo')!;
      expect(pranzo.items).toHaveLength(before + 1);
      expect(pranzo.items.at(-1)).toEqual({ foodId: 'grana', grams: 10, subs: [] });
      // Il salvataggio aggiorna anche le impostazioni: si aspetta che finisca.
      expect(editor.dirty).toBe(false);
    });
  });
});

describe('Fuori piano', () => {
  it('il bilancio somma le voci fuori piano', async () => {
    await extrasState.add({ kind: 'catalogo', item: EXTRAS_CATALOG.find((x) => x.id === 'gelato')! }, DATE, { freeSlot: null });
    render(DayView, { date: DATE });
    expect(screen.getByRole('button', { name: 'Bilancio del giorno: dettagli' })).toHaveTextContent('Fuori piano 260');
  });

  it('aggiunge uno sgarro dal catalogo e lo conta nel bilancio', async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Cornetto semplice' }));
    await waitFor(async () => expect((await db.extras.toArray())[0]).toMatchObject({ name: 'Cornetto semplice', qty: 1, origin: 'catalogo' }));
    expect(screen.getByText(/Cornetto semplice aggiunto/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bilancio del giorno: dettagli' })).toHaveTextContent('Fuori piano 300');
  });

  it('la ricerca trova le voci senza accenti', async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.input(screen.getByLabelText('Cerca o scrivi cosa hai mangiato'), { target: { value: 'tiramisu' } });
    expect(screen.getByRole('button', { name: 'Aggiungi Tiramisù' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiungi «tiramisu» a mano' })).toBeInTheDocument();
  });
});

describe('Fuori piano · voce a mano e grammi', () => {
  async function openManual(name: string) {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.input(screen.getByLabelText('Cerca o scrivi cosa hai mangiato'), { target: { value: name } });
    await fireEvent.click(screen.getByRole('button', { name: `Aggiungi «${name}» a mano` }));
  }
  const typeIn = (label: string, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } });

  it('aggiunge una voce a mano con le kcal dai macro', async () => {
    await openManual('barretta');
    for (const [l, v] of [['Proteine', '4'], ['Carboidrati', '22'], ['Grassi', '9']] as const) await typeIn(l, v);
    expect(screen.getByLabelText('kcal')).toHaveValue('185');
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi a oggi' }));
    await waitFor(async () => {
      expect((await db.extras.toArray())[0]).toMatchObject({ name: 'barretta', origin: 'mia', macro: { kcal: 185, p: 4, c: 22, f: 9 } });
      expect(await db.customItems.count()).toBe(1);
    });
  });

  it('le kcal scritte a mano non vengono sovrascritte dai macro', async () => {
    await openManual('barretta');
    for (const [l, v] of [['Proteine', '4'], ['Carboidrati', '22'], ['Grassi', '9']] as const) await typeIn(l, v);
    await typeIn('kcal', '200');
    await typeIn('Grassi', '10');
    expect(screen.getByLabelText('kcal')).toHaveValue('200');
  });

  it('accetta i grammi con la virgola', async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await typeIn('Cerca o scrivi cosa hai mangiato', 'pane integrale');
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Pane integrale' }));
    await typeIn('Grammi', '40,5');
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));
    await waitFor(async () => expect((await db.extras.toArray())[0]).toMatchObject({ origin: 'alimento', grams: 40.5, refId: 'pane-integrale' }));
  });

  it("l'elenco del giorno mostra le voci ripetute come ×2", async () => {
    const gelato = EXTRAS_CATALOG.find((x) => x.id === 'gelato')!;
    await extrasState.add({ kind: 'catalogo', item: gelato }, DATE, { freeSlot: null });
    await extrasState.add({ kind: 'catalogo', item: gelato }, DATE, { freeSlot: null });
    render(DayView, { date: DATE });
    const row = screen.getByRole('button', { name: /Gelato in coppetta/ });
    expect(row).toHaveTextContent('×2');
    expect(row).toHaveTextContent('520');
  });
});

describe('Pasto libero', () => {
  it('segna e annulla un pasto libero', async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Pasto libero' }));
    await waitFor(async () => expect(await db.mealLogs.get([DATE, 'colazione'])).toMatchObject({ kind: 'libero' }));
    expect(screen.getByRole('dialog', { name: 'Pasto libero · Colazione' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Cornetto semplice' }));
    await waitFor(async () => expect((await db.extras.toArray())[0]).toMatchObject({ freeSlot: 'colazione' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Fine' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Annulla pasto libero' }));
    await waitFor(async () => {
      expect(await db.mealLogs.get([DATE, 'colazione'])).toBeUndefined();
      expect((await db.extras.toArray())[0]!.freeSlot).toBeNull();
    });
  });

  it('avvisa se i pasti liberi della settimana sono più di uno', async () => {
    await extrasState.markFree('2026-10-27', 'cena');
    await extrasState.markFree(DATE, 'cena');
    render(Settimana, {});
    expect(screen.getByText('Il piano ne prevede uno a settimana')).toBeInTheDocument();
    expect(screen.getByText('2 su 1')).toBeInTheDocument();
  });
});

describe('Foglio Ho mangiato altro', () => {
  it("i recenti non spostano l'elenco mentre si aggiunge", async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Cornetto semplice' }));
    await waitFor(async () => expect(await db.extras.count()).toBe(1));
    expect(screen.queryByText('Recenti')).toBeNull();
  });
});

describe('Correzioni dalla revisione', () => {
  const cornetto = () => EXTRAS_CATALOG.find((x) => x.id === 'cornetto')!;
  const typeIn = (label: string, value: string) => fireEvent.input(screen.getByLabelText(label), { target: { value } });
  async function openManual(name: string) {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await typeIn('Cerca o scrivi cosa hai mangiato', name);
    await fireEvent.click(screen.getByRole('button', { name: `Aggiungi «${name}» a mano` }));
  }

  it('una voce di un pasto libero si può eliminare dalla scheda del pasto', async () => {
    await extrasState.markFree(DATE, 'colazione');
    await extrasState.add({ kind: 'catalogo', item: cornetto() }, DATE, { freeSlot: 'colazione' });
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: /^Cornetto semplice/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    await waitFor(async () => expect(await db.extras.count()).toBe(0));
  });

  it('una voce tua si elimina da Le mie', async () => {
    await extrasState.addManual({ name: 'Barretta', portion: '', macro: { kcal: 185, p: 0, c: 0, f: 0 } }, DATE, { freeSlot: null, save: true });
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Le mie' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Elimina Barretta dalle mie voci' }));
    await waitFor(async () => expect(await db.customItems.count()).toBe(0));
  });

  it('un macro scritto male mostra un errore invece di valere 0', async () => {
    await openManual('barretta');
    await typeIn('kcal', '100');
    await typeIn('Grassi', 'abc');
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi a oggi' }));
    expect(screen.getByText('Proteine, carboidrati e grassi non possono essere negativi.')).toBeInTheDocument();
    expect(await db.extras.count()).toBe(0);
  });

  it('cancellando le kcal torna il calcolo dai macro', async () => {
    await openManual('barretta');
    for (const [l, v] of [['Proteine', '4'], ['Carboidrati', '22'], ['Grassi', '9']] as const) await typeIn(l, v);
    await typeIn('kcal', '200');
    await typeIn('kcal', '');
    expect(screen.getByLabelText('kcal')).toHaveValue('185');
  });

  it('un doppio tocco su Aggiungi a oggi aggiunge una volta sola', async () => {
    await openManual('barretta');
    await typeIn('kcal', '100');
    const btn = screen.getByRole('button', { name: 'Aggiungi a oggi' });
    await Promise.all([fireEvent.click(btn), fireEvent.click(btn)]);
    await waitFor(async () => expect(await db.extras.count()).toBe(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(await db.extras.count()).toBe(1);
    expect(await db.customItems.count()).toBe(1);
  });
});

describe('Pasti come li ha dati il medico', () => {
  it('le schede mostrano solo gli alimenti, senza titoli di piatti né note', async () => {
    render(DayView, { date: DATE });
    expect(screen.queryByText('Latte e cereali')).toBeNull();
    expect(screen.queryByText('Note e preparazione')).toBeNull();
    expect(screen.queryByText('Farro e lenticchie tiepido')).toBeNull();
    // Le righe compatte riassumono gli alimenti al posto del titolo.
    expect(screen.getByRole('button', { name: /Frutta fresca, Frutta secca/ })).toBeInTheDocument();
  });
});

describe('Avviso con Annulla', () => {
  it('anche una voce a mano si può annullare', async () => {
    render(DayView, { date: DATE });
    await fireEvent.click(screen.getByRole('button', { name: 'Ho mangiato altro' }));
    await fireEvent.input(screen.getByLabelText('Cerca o scrivi cosa hai mangiato'), { target: { value: 'barretta' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi «barretta» a mano' }));
    await fireEvent.input(screen.getByLabelText('kcal'), { target: { value: '100' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Aggiungi a oggi' }));
    await waitFor(() => expect(screen.getByText(/barretta aggiunto/)).toBeInTheDocument());
    await fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    await waitFor(async () => expect(await db.extras.count()).toBe(0));
  });
});
