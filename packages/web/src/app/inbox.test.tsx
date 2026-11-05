import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { expenseItem } from '@/test/fixtures';
import { fakeApi } from '@/test/fake-api';
import { Providers } from './providers';
import { appRoutes } from './routes';

function renderApp(path = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

const counts = () => ({
  counts: { pending: 2, processing: 0, completed: 1, failed: 3 },
});

describe('inbox', () => {
  it('lists the items returned by the API inside an accessible shell', async () => {
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({
        items: [
          expenseItem({ id: 'exp-1', title: 'Approve Acme travel expense' }),
          expenseItem({
            id: 'exp-2',
            title: 'Approve monitor purchase',
            requester: 'Tom Becker',
          }),
        ],
      }),
    });

    const { container } = renderApp();

    const list = await screen.findByRole('list', { name: 'Items' });
    expect(list).toHaveTextContent('Approve Acme travel expense');
    expect(list).toHaveTextContent('Approve monitor purchase');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Views' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to items' })).toHaveAttribute(
      'href',
      '#main-content',
    );

    // jsdom has no layout engine, so colour contrast cannot be computed here.
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('refetches when the window regains focus', async () => {
    const fetchSpy = fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({ items: [expenseItem()] }),
    });
    renderApp();
    await screen.findByRole('list', { name: 'Items' });
    const calls = () =>
      fetchSpy.mock.calls.filter(([url]) => String(url).includes('status=pending')).length;
    expect(calls()).toBe(1);

    window.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(calls()).toBe(2));
  });

  it('redirects the root to Pending and marks the current view with counts in the link names', async () => {
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({ items: [] }),
    });

    renderApp('/');

    expect(await screen.findByRole('link', { name: 'Pending, 2 items' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Failed, 3 items' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Completed, 1 item' })).toBeInTheDocument();
  });

  it('switches views and shows the items of the chosen view', async () => {
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({
        items: [expenseItem({ title: 'A pending one' })],
      }),
      '/api/items?status=failed': () => ({
        items: [expenseItem({ id: 'f', title: 'A failed one', status: 'failed' })],
      }),
    });
    renderApp('/');
    await screen.findByText('A pending one');

    await userEvent.click(screen.getByRole('link', { name: 'Failed, 3 items' }));

    expect(await screen.findByText('A failed one')).toBeInTheDocument();
    expect(screen.queryByText('A pending one')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Failed, 3 items' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows priority as text, the due date, and how late an overdue open item is', async () => {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({
        items: [
          expenseItem({
            id: 'a',
            title: 'Late',
            priority: 'urgent',
            dueDate: daysAgo(3),
          }),
          expenseItem({
            id: 'b',
            title: 'Not due',
            priority: 'low',
            dueDate: null,
          }),
        ],
      }),
    });
    renderApp('/pending');

    const list = await screen.findByRole('list', { name: 'Items' });
    const [late, notDue] = within(list).getAllByRole('listitem');
    expect(late).toHaveTextContent('Urgent');
    expect(late).toHaveTextContent('Due');
    expect(late).toHaveTextContent('3 days overdue');
    expect(notDue).toHaveTextContent('Low');
    expect(notDue).not.toHaveTextContent('overdue');
  });

  it('sends unknown views to Pending', async () => {
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({ items: [] }),
    });

    renderApp('/nonsense');

    expect(await screen.findByRole('heading', { level: 1, name: 'Pending' })).toBeInTheDocument();
  });
});
