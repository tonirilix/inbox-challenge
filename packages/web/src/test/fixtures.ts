import type { DeploymentItem, ExpenseItem } from '@inbox/contracts';

export function expenseItem(overrides: Partial<ExpenseItem> = {}): ExpenseItem {
  return {
    id: 'exp-1',
    type: 'expense',
    title: 'Approve Acme travel expense',
    priority: 'normal',
    status: 'pending',
    outcome: null,
    requester: 'Maria Lopez',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:00:00.000Z',
    dueDate: null,
    lastAttempt: null,
    failureReason: null,
    payload: {
      merchant: 'Acme Travel',
      category: 'Travel',
      amount: 100,
      currency: 'EUR',
    },
    ...overrides,
  };
}

export function deploymentItem(overrides: Partial<DeploymentItem> = {}): DeploymentItem {
  return {
    ...expenseItem(),
    id: 'dep-1',
    type: 'deployment',
    title: 'Review billing-api deploy',
    payload: { service: 'billing-api', environment: 'production', version: '2.4.0' },
    ...overrides,
  };
}
