import { describe, expect, it } from 'vitest';
import { EXTRAS_CATALOG } from './extras-catalog';
import { extraTotal, kcalFromMacros, parseAmount, validateExtra } from './extras';

describe('extras · base', () => {
  it('calcola le kcal dai macro', () => {
    expect(kcalFromMacros(4, 22, 9)).toBe(185);
    expect(kcalFromMacros(0, 0, 0)).toBe(0);
  });

  it('legge i numeri con la virgola', () => {
    expect(parseAmount('4,5')).toBe(4.5);
    expect(parseAmount(' 40.5 ')).toBe(40.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('moltiplica una voce per la quantità e somma', () => {
    const e = { macro: { kcal: 49, p: 1, c: 7, f: 2 }, qty: 2 };
    expect(extraTotal(e)).toEqual({ kcal: 98, p: 2, c: 14, f: 4 });
  });

  it('valida una voce', () => {
    const ok = { name: 'Barretta', macro: { kcal: 185, p: 4, c: 22, f: 9 }, grams: null, origin: 'manuale' as const };
    expect(validateExtra(ok)).toEqual({});
    expect(validateExtra({ ...ok, name: '  ' }).name).toBe('Scrivi cosa hai mangiato.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, kcal: 5001 } }).kcal).toBe('Le kcal devono essere tra 0 e 5000.');
    expect(validateExtra({ ...ok, macro: { ...ok.macro, f: -1 } }).macro).toBeDefined();
    expect(validateExtra({ ...ok, origin: 'alimento', grams: 0 }).grams).toBe('Inserisci i grammi.');
  });

  it('il catalogo ha 20 voci con nome e porzione separati', () => {
    expect(EXTRAS_CATALOG).toHaveLength(20);
    expect(EXTRAS_CATALOG.find((x) => x.id === 'gelato')).toMatchObject({ name: 'Gelato in coppetta', portion: '2 gusti', macro: { kcal: 260 } });
    expect(new Set(EXTRAS_CATALOG.map((x) => x.id)).size).toBe(20);
  });
});
