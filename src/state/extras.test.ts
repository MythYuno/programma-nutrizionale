import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/schema';
import { app } from './app.svelte';
import { extrasState } from './extras.svelte';
import { EXTRAS_CATALOG } from '../domain/extras-catalog';

const D = '2026-10-28';
const gelato = EXTRAS_CATALOG.find((x) => x.id === 'gelato')!;
const pizza = EXTRAS_CATALOG.find((x) => x.id === 'pizza')!;

beforeEach(async () => {
  await db.delete();
  await db.open();
  localStorage.clear();
  await app.load();
  await extrasState.load();
  app.today = D;
});

describe('stato fuori piano', () => {
  it('la stessa voce due volte nello stesso giorno diventa ×2', async () => {
    await extrasState.add({ kind: 'catalogo', item: gelato }, D, { freeSlot: null });
    await extrasState.add({ kind: 'catalogo', item: gelato }, D, { freeSlot: null });
    expect(extrasState.forDate(D)).toHaveLength(1);
    expect(extrasState.forDate(D)[0]!.qty).toBe(2);
    expect((await db.extras.toArray())[0]!.qty).toBe(2);
  });

  it('annullare il pasto libero trasforma le sue voci in sgarri', async () => {
    await extrasState.markFree(D, 'cena');
    expect(app.frees(D).has('cena')).toBe(true);
    expect(app.done(D).has('cena')).toBe(true);
    await extrasState.add({ kind: 'catalogo', item: pizza }, D, { freeSlot: 'cena' });
    await extrasState.unmarkFree(D, 'cena');
    expect(app.frees(D).has('cena')).toBe(false);
    expect(app.done(D).has('cena')).toBe(false);
    expect(extrasState.forDate(D)[0]!.freeSlot).toBeNull();
    expect((await db.extras.toArray())[0]!.freeSlot).toBeNull();
    expect(await db.mealLogs.get([D, 'cena'])).toBeUndefined();
  });

  it('remove + restore riporta la voce', async () => {
    const e = await extrasState.add({ kind: 'catalogo', item: gelato }, D, { freeSlot: null });
    const removed = await extrasState.remove(e.id);
    expect(extrasState.forDate(D)).toHaveLength(0);
    await extrasState.restore(removed!);
    expect(extrasState.forDate(D)).toEqual([e]);
    expect(await db.extras.count()).toBe(1);
  });

  it('una voce a mano salvata diventa una voce tua', async () => {
    const e = await extrasState.addManual({ name: 'Barretta', portion: '1 barretta', macro: { kcal: 185, p: 4, c: 22, f: 9 } }, D, { freeSlot: null, save: true });
    expect(e.origin).toBe('mia');
    expect(extrasState.customItems).toHaveLength(1);
    expect(e.refId).toBe(extrasState.customItems[0]!.id);
    const f = await extrasState.addManual({ name: 'Una tantum', portion: '', macro: { kcal: 100, p: 0, c: 0, f: 0 } }, D, { freeSlot: null, save: false });
    expect(f).toMatchObject({ origin: 'manuale', refId: null });
  });
});

describe('stato fuori piano · voci tue', () => {
  it('salvare due volte la stessa voce a mano non crea doppioni', async () => {
    await extrasState.addManual({ name: 'Barretta', portion: '', macro: { kcal: 185, p: 4, c: 22, f: 9 } }, D, { freeSlot: null, save: true });
    await extrasState.addManual({ name: ' barretta ', portion: '1 pezzo', macro: { kcal: 190, p: 5, c: 22, f: 9 } }, D, { freeSlot: null, save: true });
    expect(extrasState.customItems).toHaveLength(1);
    expect(extrasState.customItems[0]).toMatchObject({ macro: { kcal: 190 }, portion: '1 pezzo' });
    expect(await db.customItems.count()).toBe(1);
  });
});
