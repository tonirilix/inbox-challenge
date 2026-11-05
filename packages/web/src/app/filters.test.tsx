import { QueryClient } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { expenseItem } from '@/test/fixtures';
import { fakeApi } from '@/test/fake-api';
import { Providers } from './providers';
import { appRoutes } from './routes';

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const view = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, router };
}

const counts = () => ({ counts: { pending: 2, processing: 0, completed: 1, failed: 3 } });
const urgent = expenseItem({ id: 'u', title: 'Urgent flights', priority: 'urgent' });
const other = expenseItem({ id: 'n', title: 'Monitor' });

describe('filters', () => {
  it('filters through labelled controls, keeps them in the URL and announces the count', async () => {
    const user = userEvent.setup();
    const fetchSpy = fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({ items: [urgent, other] }),
      '/api/items?status=pending&priority=urgent': () => ({ items: [urgent] }),
      '/api/items?status=pending&priority=urgent&q=z': () => ({ items: [] }),
      '/api/items?status=pending&priority=urgent&q=zz': () => ({ items: [] }),
      '/api/items?status=pending&priority=urgent&q=zzz': () => ({ items: [] }),
    });
    const { router, container } = renderApp('/pending');
    await screen.findByRole('list', { name: 'Items' });
    expect(screen.getByText('2 items')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Priority'), 'urgent');

    expect(await screen.findByText('1 item')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?priority=urgent');
    expect(screen.getByLabelText('Type')).toBeVisible();

    await user.type(screen.getByLabelText('Search'), 'zzz');

    expect(await screen.findByText('No items match your filters.')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(await screen.findByText('0 items', { selector: '.sr-only' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?priority=urgent&q=zzz');
    expect(fetchSpy).toHaveBeenCalledWith('/api/items?status=pending&priority=urgent&q=zzz');
    expect(
      (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
    ).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByRole('list', { name: 'Items' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Priority')).toHaveValue('');
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('restores filters from the URL and ignores invalid values', async () => {
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending&priority=urgent&q=fl': () => ({ items: [urgent] }),
    });
    renderApp('/pending?priority=urgent&q=fl&type=bogus');

    const list = await screen.findByRole('list', { name: 'Items' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByLabelText('Priority')).toHaveValue('urgent');
    expect(screen.getByLabelText('Search')).toHaveValue('fl');
    expect(screen.getByLabelText('Type')).toHaveValue('');
  });

  it('keeps filters when opening an item and going back', async () => {
    const user = userEvent.setup();
    fakeApi({
      '/api/items/counts': counts,
      '/api/items?status=pending&priority=urgent': () => ({ items: [urgent] }),
      '/api/items/u': () => urgent,
    });
    const { router } = renderApp('/pending?priority=urgent');

    await user.click(await screen.findByRole('link', { name: /Urgent flights/ }));
    expect(router.state.location.pathname).toBe('/pending/u');
    expect(router.state.location.search).toBe('?priority=urgent');

    await user.click(await screen.findByRole('link', { name: 'Back to list' }));
    expect(router.state.location.search).toBe('?priority=urgent');
  });
});
