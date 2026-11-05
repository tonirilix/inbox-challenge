import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expenseItem } from '@/test/fixtures';
import { fakeApi } from '@/test/fake-api';
import { Providers } from './providers';
import { appRoutes } from './routes';

function renderApp(path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
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

  describe('item detail', () => {
    const exp1 = expenseItem({ id: 'exp-1', title: 'Approve Acme travel expense' });
    const exp2 = expenseItem({
      id: 'exp-2',
      title: 'Approve monitor purchase',
      payload: { merchant: 'Screens Ltd', category: 'Equipment', amount: 250, currency: 'EUR' },
    });
    const handlers = {
      '/api/items': () => ({ items: [exp1, exp2] }),
      '/api/items/exp-1': () => exp1,
      '/api/items/exp-2': () => exp2,
    };

    it('opens an item beside the list when selected, at its own URL', async () => {
      fakeApi(handlers);
      renderApp();

      const list = await screen.findByRole('list', { name: 'Items' });
      await userEvent.click(within(list).getByRole('link', { name: /Approve monitor purchase/ }));

      const detail = await screen.findByRole('region', { name: 'Approve monitor purchase' });
      expect(within(detail).getByText('Screens Ltd')).toBeInTheDocument();
      expect(within(list).getByRole('link', { name: /Approve monitor purchase/ })).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(within(list).getByRole('link', { name: /Approve Acme/ })).not.toHaveAttribute('aria-current');
    });

    it('shows the same split view when the item URL is opened directly', async () => {
      fakeApi(handlers);
      renderApp('/pending/exp-2');

      const detail = await screen.findByRole('region', { name: 'Approve monitor purchase' });
      expect(within(detail).getByText('Screens Ltd')).toBeInTheDocument();
      expect(await screen.findByRole('list', { name: 'Items' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to list' })).toHaveAttribute('href', '/pending');
    });

    it('shows a not-found state with a way back to the list', async () => {
      fakeApi({
        ...handlers,
        '/api/items/missing': () =>
          new Response(JSON.stringify({ title: 'Item not found', status: 404 }), {
            status: 404,
            headers: { 'content-type': 'application/problem+json' },
          }),
      });
      renderApp('/pending/missing');

      expect(await screen.findByRole('heading', { name: 'Item not found' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to list' })).toHaveAttribute('href', '/pending');
    });

    it('renders a generic card for an item type the app does not know', async () => {
      const unknown = { ...exp1, id: 'on-1', type: 'onboarding', title: 'Onboard Sam', payload: { x: 1 } };
      fakeApi({
        '/api/items': () => ({ items: [exp1, unknown] }),
        '/api/items/on-1': () => unknown,
      });
      renderApp('/pending/on-1');

      const list = await screen.findByRole('list', { name: 'Items' });
      expect(within(list).getByText(/Onboard Sam/)).toBeInTheDocument();
      const detail = await screen.findByRole('region', { name: 'Onboard Sam' });
      expect(detail).toHaveTextContent('onboarding');
      expect(detail).toHaveTextContent(/not supported/i);
    });
  });
});
