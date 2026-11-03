import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/schema';
import { app } from './app.svelte';
import { eatenState } from './eaten.svelte';
import type { PlanItem } from '../domain/types';

const D = '2026-10-28';
const manzo: PlanItem = { foodId: 'manzo-magro', grams: 220, subs: [{ foodId: 'pollo', grams: 253 }] };

beforeEach(async () => {
  await db.delete();
  await db.open();
  localStorage.clear();
  await app.load();
  app.today = D;
});

describe('stato scambi e grammi', () => {
  it('si carica insieme al resto, prima che l\'app sia pronta', async () => {
    await db.itemLogs.put({ date: D, slot: 'cena', index: 0, planFoodId: 'manzo-magro', foodId: 'pollo', grams: 253 });
    await app.load();
    expect(eatenState.forDate(D)).toHaveLength(1);
  });

  it('salva uno scambio e lo toglie se torna come nel piano', async () => {
    await eatenState.set(D, 'cena', 0, manzo, 'pollo', 253);
    expect(await db.itemLogs.count()).toBe(1);
    await eatenState.set(D, 'cena', 0, manzo, 'manzo-magro', 220);
    expect(await db.itemLogs.count()).toBe(0);
    expect(eatenState.forDate(D)).toEqual([]);
  });

  it('reset torna al piano', async () => {
    await eatenState.set(D, 'cena', 0, manzo, 'manzo-magro', 180);
    await eatenState.reset(D, 'cena', 0);
    expect(await db.itemLogs.count()).toBe(0);
  });
});
