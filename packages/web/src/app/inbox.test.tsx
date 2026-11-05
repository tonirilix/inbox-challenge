import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { expenseItem } from '@/test/fixtures';
import { fakeApi } from '@/test/fake-api';
import { Providers } from './providers';
import { appRoutes } from './routes';

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] });
  return render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

describe('inbox', () => {
  it('lists the items returned by the API inside an accessible shell', async () => {
    fakeApi({
      '/api/items': () => ({
        items: [
          expenseItem({ id: 'exp-1', title: 'Approve Acme travel expense' }),
          expenseItem({ id: 'exp-2', title: 'Approve monitor purchase', requester: 'Tom Becker' }),
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
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to items' })).toHaveAttribute('href', '#main-content');

    // jsdom has no layout engine, so colour contrast cannot be computed here.
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('refetches when the window regains focus', async () => {
    const fetchSpy = fakeApi({ '/api/items': () => ({ items: [expenseItem()] }) });
    renderApp();
    await screen.findByRole('list', { name: 'Items' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});
