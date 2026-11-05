import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { deploymentItem, documentationItem, expenseItem } from '@/test/fixtures';
import { fakeApi } from '@/test/fake-api';
import { Providers } from './providers';
import { appRoutes } from './routes';

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

// jsdom has no layout engine, so colour contrast cannot be computed here.
const check = (container: HTMLElement) =>
  axe(container, { rules: { 'color-contrast': { enabled: false } } });

const counts = () => ({ counts: { pending: 3, processing: 0, completed: 1, failed: 1 } });

describe('accessibility of the inbox views', () => {
  const expense = expenseItem({ id: 'exp-1', dueDate: '2020-01-01', priority: 'urgent' });
  const deployment = deploymentItem({ id: 'dep-1' });
  const doc = documentationItem({ id: 'doc-1' });
  const failed = expenseItem({
    id: 'exp-f',
    title: 'Approve failed expense',
    status: 'failed',
    failureReason: 'The accounting system did not respond.',
    lastAttempt: { action: 'approve', input: {} },
  });
  const done = expenseItem({ id: 'exp-c', title: 'Done expense', status: 'completed', outcome: 'rejected' });

  const handlers = {
    '/api/items/counts': counts,
    '/api/items?status=pending': () => ({ items: [expense, deployment, doc] }),
    '/api/items?status=failed': () => ({ items: [failed] }),
    '/api/items?status=completed': () => ({ items: [done] }),
    '/api/items/exp-1': () => expense,
    '/api/items/dep-1': () => deployment,
    '/api/items/doc-1': () => doc,
    '/api/items/exp-f': () => failed,
    '/api/items/exp-c': () => done,
  };

  it.each([
    ['a pending expense with its action form', '/pending/exp-1', 'button', 'Approve'],
    ['a pending deployment with its action form', '/pending/dep-1', 'button', 'Approve'],
    ['a pending documentation item with its action form', '/pending/doc-1', 'textbox', /link/i],
    ['a failed item with the alert and recovery controls', '/failed/exp-f', 'button', 'Retry'],
    ['a completed item', '/completed/exp-c', 'region', 'Done expense'],
  ] as const)('has no violations on %s', async (_name, path, role, name) => {
    fakeApi(handlers);
    const { container } = renderApp(path);
    await screen.findByRole(role, { name });
    expect((await check(container)).violations).toEqual([]);
  });

  it('has no violations with the reject form revealing its validation error', async () => {
    fakeApi(handlers);
    const { container } = renderApp('/pending/exp-1');
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(await screen.findByText('Enter a reason for rejecting')).toBeInTheDocument();
    expect((await check(container)).violations).toEqual([]);
  });

  it.each(['failed', 'completed'])('has no violations on the %s list', async (view) => {
    fakeApi(handlers);
    const { container } = renderApp(`/${view}`);
    await screen.findByRole('list', { name: 'Items' });
    expect((await check(container)).violations).toEqual([]);
  });
});
