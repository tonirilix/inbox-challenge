import { priorities, type Item, type Status } from '@inbox/contracts';

type Comparator = (a: Item, b: Item) => number;

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Pending: priority, then earliest due date (none last), then oldest. */
const pending: Comparator = (a, b) =>
  priorities.indexOf(a.priority) - priorities.indexOf(b.priority) ||
  byText(a.dueDate ?? '9999-12-31', b.dueDate ?? '9999-12-31') ||
  byText(a.createdAt, b.createdAt);

/** Failed and Completed: most recent status change first. */
const mostRecentlyUpdated: Comparator = (a, b) => byText(b.updatedAt, a.updatedAt);

const comparators: Record<Status, Comparator> = {
  pending,
  processing: mostRecentlyUpdated,
  failed: mostRecentlyUpdated,
  completed: mostRecentlyUpdated,
};

export const orderForView = (status: Status, items: Item[]): Item[] =>
  [...items].sort(comparators[status]);
