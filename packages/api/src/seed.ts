import type { DocumentationItem, ExpenseItem, Item } from '@inbox/contracts';

type ExpenseSeed = Pick<ExpenseItem, 'id' | 'title' | 'priority' | 'requester' | 'payload'> &
  Partial<Pick<ExpenseItem, 'status' | 'outcome' | 'failureReason'>> & {
    /** Days from today; negative is in the past. */
    due?: number;
    /** Hours ago the item last changed status. */
    updatedHoursAgo?: number;
  };

type DocumentationSeed = Pick<
  DocumentationItem,
  'id' | 'title' | 'priority' | 'requester' | 'payload'
> &
  Partial<Pick<DocumentationItem, 'status' | 'outcome' | 'failureReason'>> & {
    due?: number;
    updatedHoursAgo?: number;
  };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function seedItems(now: Date = new Date()): Item[] {
  const date = (offsetDays: number) =>
    new Date(now.getTime() + offsetDays * DAY).toISOString().slice(0, 10);
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR).toISOString();

  const expense = ({ due, updatedHoursAgo = 24 * 7, ...seed }: ExpenseSeed): Item => ({
    status: 'pending',
    outcome: null,
    failureReason: null,
    ...seed,
    type: 'expense',
    createdAt: ago(24 * 8),
    updatedAt: ago(updatedHoursAgo),
    dueDate: due === undefined ? null : date(due),
    lastAttempt: null,
  });

  const documentation = ({
    due,
    updatedHoursAgo = 24 * 7,
    ...seed
  }: DocumentationSeed): Item => ({
    status: 'pending',
    outcome: null,
    failureReason: null,
    ...seed,
    type: 'documentation',
    createdAt: ago(24 * 8),
    updatedAt: ago(updatedHoursAgo),
    dueDate: due === undefined ? null : date(due),
    lastAttempt: null,
  });

  return [
    expense({
      id: 'exp-1',
      title: 'Approve Acme travel expense',
      priority: 'high',
      requester: 'Maria Lopez',
      due: 5,
      payload: {
        merchant: 'Acme Travel',
        category: 'Travel',
        amount: 1280.5,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-2',
      title: 'Approve team offsite catering',
      priority: 'normal',
      requester: 'Jonas Weber',
      due: 9,
      payload: {
        merchant: 'Fresh Bites',
        category: 'Meals',
        amount: 640,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-3',
      title: 'Approve conference ticket',
      priority: 'urgent',
      requester: 'Priya Nair',
      due: -2,
      payload: {
        merchant: 'DevSummit',
        category: 'Training',
        amount: 899,
        currency: 'USD',
      },
    }),
    expense({
      id: 'exp-4',
      title: 'Approve monitor purchase',
      priority: 'low',
      requester: 'Tom Becker',
      payload: {
        merchant: 'Office Depot',
        category: 'Equipment',
        amount: 329.99,
        currency: 'USD',
      },
    }),
    expense({
      id: 'exp-5',
      title: 'Approve client dinner',
      priority: 'normal',
      requester: 'Maria Lopez',
      due: 7,
      payload: {
        merchant: 'La Trattoria',
        category: 'Meals',
        amount: 212.4,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-6',
      title: 'Approve cloud hosting invoice',
      priority: 'high',
      requester: 'Priya Nair',
      due: -1,
      status: 'failed',
      failureReason: 'The accounting system did not respond.',
      updatedHoursAgo: 3,
      payload: {
        merchant: 'CloudCo',
        category: 'Software',
        amount: 2400,
        currency: 'USD',
      },
    }),
    expense({
      id: 'exp-7',
      title: 'Approve taxi receipts',
      priority: 'low',
      requester: 'Jonas Weber',
      due: 2,
      status: 'failed',
      failureReason: 'The payment reference was rejected by the finance system.',
      updatedHoursAgo: 30,
      payload: {
        merchant: 'CityCab',
        category: 'Travel',
        amount: 58.2,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-8',
      title: 'Approve hotel booking',
      priority: 'normal',
      requester: 'Tom Becker',
      status: 'processing',
      updatedHoursAgo: 1,
      payload: {
        merchant: 'Grand Hotel',
        category: 'Travel',
        amount: 540,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-9',
      title: 'Approve team lunch',
      priority: 'normal',
      requester: 'Maria Lopez',
      status: 'completed',
      outcome: 'approved',
      updatedHoursAgo: 5,
      payload: {
        merchant: 'Pasta Place',
        category: 'Meals',
        amount: 96,
        currency: 'EUR',
      },
    }),
    expense({
      id: 'exp-10',
      title: 'Approve premium software licence',
      priority: 'high',
      requester: 'Jonas Weber',
      status: 'completed',
      outcome: 'rejected',
      updatedHoursAgo: 48,
      payload: {
        merchant: 'Toolsmith',
        category: 'Software',
        amount: 5200,
        currency: 'USD',
      },
    }),
    expense({
      id: 'exp-11',
      title: 'Approve stale parking fee',
      priority: 'low',
      requester: 'Priya Nair',
      status: 'completed',
      outcome: 'dismissed',
      updatedHoursAgo: 96,
      payload: {
        merchant: 'ParkCo',
        category: 'Travel',
        amount: 12,
        currency: 'EUR',
      },
    }),
    documentation({
      id: 'doc-1',
      title: 'Document the onboarding flow',
      priority: 'high',
      requester: 'Priya Nair',
      due: 3,
      payload: { topic: 'Onboarding flow', audience: 'New hires' },
    }),
    documentation({
      id: 'doc-2',
      title: 'Document the release checklist',
      priority: 'urgent',
      requester: 'Tom Becker',
      due: -1,
      payload: { topic: 'Release checklist', audience: 'Engineers' },
    }),
    documentation({
      id: 'doc-3',
      title: 'Document the expense policy',
      priority: 'low',
      requester: 'Maria Lopez',
      status: 'processing',
      updatedHoursAgo: 2,
      payload: { topic: 'Expense policy', audience: 'All staff' },
    }),
    documentation({
      id: 'doc-4',
      title: 'Document the on-call rota',
      priority: 'normal',
      requester: 'Jonas Weber',
      status: 'completed',
      outcome: 'done',
      updatedHoursAgo: 20,
      payload: { topic: 'On-call rota', audience: 'Engineers' },
    }),
  ];
}
