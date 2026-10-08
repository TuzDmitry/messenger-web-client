const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
const longDayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' });
const longDateFormat = new Intl.DateTimeFormat('ru', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateFormat = new Intl.DateTimeFormat('ru', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

const DAY_MS = 24 * 60 * 60 * 1000;

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** «14:05» */
export function formatTime(timestamp: number): string {
  return timeFormat.format(new Date(timestamp));
}

/** Chat list style: «14:05» today, «8 окт.» this year, «08.10.25» before. */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  if (isSameDay(date, today)) return timeFormat.format(date);
  if (date.getFullYear() === today.getFullYear()) return dayFormat.format(date);

  return dateFormat.format(date);
}

type DayLabels = { today: string; yesterday: string };

/** Feed day separator: «Сегодня», «Вчера», «8 октября», «31 декабря 2025 г.» */
export function formatDay(timestamp: number, labels: DayLabels, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  if (isSameDay(date, today)) return labels.today;
  if (isSameDay(date, new Date(now - DAY_MS))) return labels.yesterday;
  if (date.getFullYear() === today.getFullYear()) return longDayFormat.format(date);

  return longDateFormat.format(date);
}

/** Key that is equal for timestamps on the same local day. */
export function dayKey(timestamp: number): string {
  return new Date(timestamp).toDateString();
}
