import { t } from '../i18n';

export function peso(n: number): string {
  const r = Math.round(n);
  const s = Math.abs(r)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${r < 0 ? '-' : ''}₱${s}`;
}

export function compact(n: number): string {
  if (n >= 10000) return '10k+';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${n}`;
}

export function soldLabel(n: number): string {
  return t('{n} sold', { n: compact(n) });
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function dateTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  return `${shortDate(d)}, ${d.getFullYear()} ${((h + 11) % 12) + 1}:${pad2(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

export function deliveryWindow(fromDays: number, toDays: number, now = Date.now()): string {
  const day = 86400000;
  return `${shortDate(new Date(now + fromDays * day))} – ${shortDate(new Date(now + toDays * day))}`;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function countdownParts(ms: number): [string, string, string] {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [pad2(Math.floor(s / 3600)), pad2(Math.floor((s % 3600) / 60)), pad2(s % 60)];
}
