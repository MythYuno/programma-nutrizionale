import type { Slot } from '../domain/types';
import { parseDate } from '../domain/schedule';

// Ogni fascia ha il suo colore: lo stesso del fondo quando è il pasto di adesso.
export const SLOT_COLOR: Record<Slot, string> = {
  colazione: 'var(--slot-colazione)',
  spuntinoMattino: 'var(--slot-spuntinoMattino)',
  pranzo: 'var(--slot-pranzo)',
  spuntinoPomeriggio: 'var(--slot-spuntinoPomeriggio)',
  cena: 'var(--slot-cena)',
};

const fmtLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtWeekday = new Intl.DateTimeFormat('it-IT', { weekday: 'long' });
const fmtShort = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric' });
const fmtDayMonth = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const longDate = (d: string) => cap(fmtLong.format(parseDate(d)));
export const weekdayName = (d: string) => cap(fmtWeekday.format(parseDate(d)));
export const shortDate = (d: string) => cap(fmtShort.format(parseDate(d)).replace('.', ''));
export const dayMonth = (d: string) => fmtDayMonth.format(parseDate(d)).replace('.', '');
