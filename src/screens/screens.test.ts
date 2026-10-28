import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { db } from '../db/schema';
import { app } from '../state/app.svelte';
import { editor } from '../state/editor.svelte';
import DayView from './DayView.svelte';
import Peso from './Peso.svelte';
import PlanEditor from './plan/PlanEditor.svelte';

// Un mercoledì: il piano v1 ha "Farro e lenticchie tiepido" a pranzo.
const DATE = '2026-10-28';

beforeEach(async () => {
  await db.delete();
  await db.open();
  localStorage.clear();
  editor.draft = null;
  await app.load();
  app.today = DATE;
});

describe('Oggi', () => {
  it('mostra il primo pasto e lo segna come fatto', async () => {
    render(DayView, { date: DATE });
    expect(screen.getByText('Adesso · Colazione')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Fatto' }));
    await waitFor(() => expect(screen.getByText('Adesso · Spuntino mattino')).toBeInTheDocument());
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
    });
  });
});
