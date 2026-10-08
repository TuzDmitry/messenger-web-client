const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' });
const dateFormat = new Intl.DateTimeFormat('ru', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Chat list style: «14:05» today, «8 окт.» this year, «08.10.25» before. */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  if (isSameDay(date, today)) return timeFormat.format(date);
  if (date.getFullYear() === today.getFullYear()) return dayFormat.format(date);

  return dateFormat.format(date);
}
