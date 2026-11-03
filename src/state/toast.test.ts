import { describe, expect, it } from 'vitest';
import { toast } from './toast.svelte';

describe('avviso unico', () => {
  it('un avviso nuovo sostituisce il precedente e Annulla agisce sull\'ultimo', async () => {
    const done: string[] = [];
    toast.show('Primo', { label: 'Annulla', run: () => { done.push('primo'); } });
    toast.show('Secondo', { label: 'Annulla', run: () => { done.push('secondo'); } });
    expect(toast.message).toBe('Secondo');
    await toast.runAction();
    expect(done).toEqual(['secondo']);
    expect(toast.message).toBeNull();
  });
});
