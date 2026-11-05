import type { Item } from '@inbox/contracts';

const DAY_MS = 86_400_000;

const localDate = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Whole days an open item is past its due date, or 0 if it is not overdue (derived, never stored). */
export function daysOverdue(
  item: Pick<Item, 'status' | 'dueDate'>,
  now: Date = new Date(),
): number {
  if (item.status === 'completed' || item.dueDate === null) return 0;
  const days = (Date.parse(localDate(now)) - Date.parse(item.dueDate)) / DAY_MS;
  return Math.max(0, days);
}

export const overdueText = (days: number) => `${days} ${days === 1 ? 'day' : 'days'} overdue`;
