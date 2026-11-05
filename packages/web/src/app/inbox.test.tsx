import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { deploymentItem, documentationItem, expenseItem } from '@/test/fixtures';
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
    expect(screen.getByRole('link', { name: 'Skip to items' })).toHaveAttribute('href', '#main-content');

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
    const calls = () => fetchSpy.mock.calls.filter(([url]) => String(url).includes('status=pending')).length;
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
    expect(screen.getByRole('link', { name: 'Failed, 3 items' })).not.toHaveAttribute('aria-current');
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
    expect(screen.getByRole('link', { name: 'Failed, 3 items' })).toHaveAttribute('aria-current', 'page');
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

  describe('item detail', () => {
    const exp1 = expenseItem({ id: 'exp-1', title: 'Approve Acme travel expense' });
    const exp2 = expenseItem({
      id: 'exp-2',
      title: 'Approve monitor purchase',
      payload: { merchant: 'Screens Ltd', category: 'Equipment', amount: 250, currency: 'EUR' },
    });
    const handlers = {
      '/api/items/counts': counts,
      '/api/items?status=pending': () => ({ items: [exp1, exp2] }),
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
      const unknown = {
        ...exp1,
        id: 'on-1',
        type: 'onboarding',
        title: 'Onboard Sam',
        payload: { x: 1 },
      };
      fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: [exp1, unknown] }),
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

  describe('completing an expense', () => {
    const exp1 = expenseItem({ id: 'exp-1', title: 'Approve Acme travel expense' });
    const exp2 = expenseItem({ id: 'exp-2', title: 'Approve monitor purchase' });

    /** A server whose pending list shrinks once exp-1 is actioned. */
    function serverWithActionResult(result: () => unknown) {
      let handled = false;
      return fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: handled ? [exp2] : [exp1, exp2] }),
        '/api/items/exp-1': () => exp1,
        '/api/items/exp-2': () => exp2,
        '/api/items/exp-1/actions': () => {
          handled = true;
          return result();
        },
      });
    }

    it('approves, moves focus to the next item and announces the outcome', async () => {
      const fetchSpy = serverWithActionResult(() => ({
        ...exp1,
        status: 'completed',
        outcome: 'approved',
      }));
      renderApp('/pending/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

      expect(
        await screen.findByText('Approved “Approve Acme travel expense”. Next: Approve monitor purchase.'),
      ).toBeInTheDocument();
      const list = screen.getByRole('list', { name: 'Items' });
      await waitFor(() =>
        expect(within(list).queryByText(/Approve Acme travel expense/)).not.toBeInTheDocument(),
      );
      expect(within(list).getByRole('link', { name: /Approve monitor purchase/ })).toHaveFocus();
      expect(await screen.findByRole('region', { name: 'Approve monitor purchase' })).toBeVisible();
      const post = fetchSpy.mock.calls.find(([url]) => String(url) === '/api/items/exp-1/actions');
      expect(post?.[1]?.method).toBe('POST');
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({ action: 'approve' });
    });

    it('moves focus to the list heading when no items remain', async () => {
      let handled = false;
      fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: handled ? [] : [exp1] }),
        '/api/items/exp-1': () => exp1,
        '/api/items/exp-1/actions': () => {
          handled = true;
          return { ...exp1, status: 'completed', outcome: 'approved' };
        },
      });
      renderApp('/pending/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

      expect(await screen.findByText(/No items remain/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Pending' })).toHaveFocus();
    });

    it('requires a reason to reject, shown next to the field, then rejects with it', async () => {
      const fetchSpy = serverWithActionResult(() => ({
        ...exp1,
        status: 'completed',
        outcome: 'rejected',
      }));
      renderApp('/pending/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));

      const reason = screen.getByRole('textbox', { name: /Reason/ });
      expect(reason).toBeInvalid();
      expect(reason).toHaveFocus();
      expect(reason).toHaveAccessibleDescription(/Enter a reason for rejecting/);
      expect(fetchSpy.mock.calls.some(([url]) => String(url).endsWith('/actions'))).toBe(false);

      await userEvent.type(reason, 'Over budget');
      await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

      expect(await screen.findByText(/^Rejected “Approve Acme/)).toBeInTheDocument();
      const post = fetchSpy.mock.calls.find(([url]) => String(url).endsWith('/actions'));
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({
        action: 'reject',
        input: { reason: 'Over budget' },
      });
    });

    it('explains that the item was already handled on a conflict and refreshes the data', async () => {
      const fetchSpy = fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: [exp1] }),
        '/api/items/exp-1': () => exp1,
        '/api/items/exp-1/actions': () =>
          new Response(
            JSON.stringify({ title: 'Item already handled', status: 409, itemStatus: 'completed' }),
            { status: 409, headers: { 'content-type': 'application/problem+json' } },
          ),
      });
      renderApp('/pending/exp-1');
      const detailCalls = () =>
        fetchSpy.mock.calls.filter(([url]) => String(url) === '/api/items/exp-1').length;
      await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/already handled/i);
      await waitFor(() => expect(detailCalls()).toBeGreaterThan(1));
    });
  });

  describe('failed items', () => {
    const failed = expenseItem({
      id: 'exp-1',
      title: 'Approve Acme travel expense',
      status: 'failed',
      failureReason: 'The accounting system did not respond.',
      lastAttempt: { action: 'approve', input: {} },
    });
    const other = expenseItem({ id: 'exp-2', title: 'Approve monitor purchase', status: 'failed' });

    function serverWithRecovery(result: unknown) {
      let handled = false;
      return fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=failed': () => ({ items: handled ? [other] : [failed, other] }),
        '/api/items/exp-1': () => (handled ? result : failed),
        '/api/items/exp-2': () => other,
        '/api/items/exp-1/actions': () => {
          handled = true;
          return result;
        },
      });
    }

    it('shows the reason and last attempt in an alert with Retry and Dismiss', async () => {
      serverWithRecovery({ ...failed, status: 'completed', outcome: 'approved' });
      renderApp('/failed/exp-1');

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('The accounting system did not respond.');
      expect(alert).toHaveTextContent(/Last attempt: approve/);
      expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    });

    it('retries, moves focus to the next failed item and announces the outcome', async () => {
      const fetchSpy = serverWithRecovery({ ...failed, status: 'completed', outcome: 'approved' });
      renderApp('/failed/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

      expect(
        await screen.findByText('Approved “Approve Acme travel expense”. Next: Approve monitor purchase.'),
      ).toBeInTheDocument();
      const list = screen.getByRole('list', { name: 'Items' });
      await waitFor(() =>
        expect(within(list).queryByText(/Approve Acme travel expense/)).not.toBeInTheDocument(),
      );
      expect(within(list).getByRole('link', { name: /Approve monitor purchase/ })).toHaveFocus();
      const post = fetchSpy.mock.calls.find(([url]) => String(url) === '/api/items/exp-1/actions');
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({ action: 'retry' });
    });

    it('announces when the retry fails again and keeps the item in place', async () => {
      serverWithRecovery({ ...failed, failureReason: 'Still down' });
      renderApp('/failed/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

      expect(
        await screen.findByText(/Could not complete “Approve Acme travel expense”: Still down/),
      ).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Retry' })).toBeEnabled();
    });

    it('dismisses, moves focus to the next item and announces it', async () => {
      const fetchSpy = serverWithRecovery({ ...failed, status: 'completed', outcome: 'dismissed' });
      renderApp('/failed/exp-1');

      await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

      expect(
        await screen.findByText('Dismissed “Approve Acme travel expense”. Next: Approve monitor purchase.'),
      ).toBeInTheDocument();
      const list = screen.getByRole('list', { name: 'Items' });
      expect(await within(list).findByRole('link', { name: /Approve monitor purchase/ })).toHaveFocus();
      const post = fetchSpy.mock.calls.find(([url]) => String(url) === '/api/items/exp-1/actions');
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({ action: 'dismiss' });
    });
  });

  describe('reviewing a deployment', () => {
    const dep = deploymentItem({ id: 'dep-1', title: 'Review billing-api deploy' });

    it('approves, or requires a comment to request changes', async () => {
      const fetchSpy = fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: [dep] }),
        '/api/items/dep-1': () => dep,
        '/api/items/dep-1/actions': () => ({ ...dep, status: 'completed', outcome: 'rejected' }),
      });
      renderApp('/pending/dep-1');

      expect(await screen.findByText('billing-api')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
      const comment = screen.getByRole('textbox', { name: /Comment/ });
      expect(comment).toBeInvalid();
      expect(comment).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();

      await userEvent.type(comment, 'Add a rollback plan');
      await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));

      expect(await screen.findByText(/^Rejected “Review billing-api deploy”/)).toBeInTheDocument();
      const post = fetchSpy.mock.calls.find(([url]) => String(url).endsWith('/actions'));
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({
        action: 'request_changes',
        input: { comment: 'Add a rollback plan' },
      });
  });

    });
  describe('completing a documentation item', () => {
    const doc = documentationItem();

    function server() {
      return fakeApi({
        '/api/items/counts': counts,
        '/api/items?status=pending': () => ({ items: [doc] }),
        '/api/items/doc-1': () => doc,
        '/api/items/doc-1/actions': () => ({ ...doc, status: 'completed', outcome: 'done' }),
      });
    }
    const posted = (fetchSpy: ReturnType<typeof server>) =>
      fetchSpy.mock.calls.find(([url]) => String(url).endsWith('/actions'));

    it('shows the payload and submits a link with a note', async () => {
      const fetchSpy = server();
      renderApp('/pending/doc-1');

      expect(await screen.findByText('Onboarding flow')).toBeInTheDocument();
      await userEvent.type(screen.getByRole('textbox', { name: /Link/ }), 'https://docs.example.com/a');
      await userEvent.type(screen.getByRole('textbox', { name: /Note/ }), 'Draft');
      await userEvent.click(screen.getByRole('button', { name: 'Submit link' }));

      expect(await screen.findByText(/^Done “Document the onboarding flow”/)).toBeInTheDocument();
      expect(JSON.parse(String(posted(fetchSpy)?.[1]?.body))).toEqual({
        action: 'submit',
        input: { link: 'https://docs.example.com/a', note: 'Draft' },
      });
    });

    it('explains a malformed link next to the field and does not submit', async () => {
      const fetchSpy = server();
      renderApp('/pending/doc-1');

      await userEvent.type(await screen.findByRole('textbox', { name: /Link/ }), 'nope');
      await userEvent.click(screen.getByRole('button', { name: 'Submit link' }));

      const link = screen.getByRole('textbox', { name: /Link/ });
      expect(link).toBeInvalid();
      expect(link).toHaveFocus();
      expect(link).toHaveAccessibleDescription(/valid link/);
      expect(posted(fetchSpy)).toBeUndefined();
    });
  });
});
