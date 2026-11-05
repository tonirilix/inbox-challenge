import type { ExpenseItem, Item } from '@inbox/contracts';

type ExpenseSeed = Pick<ExpenseItem, 'id' | 'title' | 'priority' | 'requester' | 'dueDate' | 'payload'>;

const expense = (seed: ExpenseSeed): Item => ({
  ...seed,
  type: 'expense',
  status: 'pending',
  outcome: null,
  createdAt: '2026-10-28T09:00:00.000Z',
  lastAttempt: null,
  failureReason: null,
});

export function seedItems(): Item[] {
  return [
    expense({
      id: 'exp-1',
      title: 'Approve Acme travel expense',
      priority: 'high',
      requester: 'Maria Lopez',
      dueDate: '2026-11-10',
      payload: { merchant: 'Acme Travel', category: 'Travel', amount: 1280.5, currency: 'EUR' },
    }),
    expense({
      id: 'exp-2',
      title: 'Approve team offsite catering',
      priority: 'normal',
      requester: 'Jonas Weber',
      dueDate: '2026-11-14',
      payload: { merchant: 'Fresh Bites', category: 'Meals', amount: 640, currency: 'EUR' },
    }),
    expense({
      id: 'exp-3',
      title: 'Approve conference ticket',
      priority: 'urgent',
      requester: 'Priya Nair',
      dueDate: '2026-11-03',
      payload: { merchant: 'DevSummit', category: 'Training', amount: 899, currency: 'USD' },
    }),
    expense({
      id: 'exp-4',
      title: 'Approve monitor purchase',
      priority: 'low',
      requester: 'Tom Becker',
      dueDate: null,
      payload: { merchant: 'Office Depot', category: 'Equipment', amount: 329.99, currency: 'USD' },
    }),
    expense({
      id: 'exp-5',
      title: 'Approve client dinner',
      priority: 'normal',
      requester: 'Maria Lopez',
      dueDate: '2026-11-12',
      payload: { merchant: 'La Trattoria', category: 'Meals', amount: 212.4, currency: 'EUR' },
    }),
  ];
}
