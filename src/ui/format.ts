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
const fmtMonth = new Intl.DateTimeFormat('it-IT', { month: 'short' });
const fmtMonthLong = new Intl.DateTimeFormat('it-IT', { month: 'long' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const longDate = (d: string) => cap(fmtLong.format(parseDate(d)));
export const weekdayName = (d: string) => cap(fmtWeekday.format(parseDate(d)));
export const shortDate = (d: string) => cap(fmtShort.format(parseDate(d)).replace('.', ''));
export const dayMonth = (d: string) => fmtDayMonth.format(parseDate(d)).replace('.', '');

// «dal 2 all'8 nov», «dal 26 ott al 1° nov»: l'articolo si elide davanti a 8 e 11.
const dayWord = (d: string) => { const n = parseDate(d).getDate(); return n === 1 ? '1°' : String(n); };
const prep = (base: 'dal' | 'al', d: string) => (/^(8|11)$/.test(dayWord(d)) ? (base === 'dal' ? "dall'" : "all'") : base + ' ');
const monthShort = (d: string) => fmtMonth.format(parseDate(d)).replace('.', '');
export function weekRange(from: string, to: string): string {
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${prep('dal', from)}${dayWord(from)}${sameMonth ? '' : ' ' + monthShort(from)} ${prep('al', to)}${dayWord(to)} ${monthShort(to)}`;
}
// Intestazione di un mese dello storico: l'anno solo se non è quello di oggi.
export function monthTitle(month: string, today: string): string {
  const s = cap(fmtMonthLong.format(parseDate(month + '-01')));
  return month.slice(0, 4) === today.slice(0, 4) ? s : `${s} ${month.slice(0, 4)}`;
}
