import { describe, expect, it } from 'vitest';
import {
  itemSchema,
  problemDetailsSchema,
  type DeploymentItem,
  type ExpenseItem,
  type Item,
  type ItemEvent,
} from '@inbox/contracts';
import { createApp } from '../src/composition-root';
import type { EventPublisher } from '../src/events/event-publisher';
import type { Executor } from '../src/executor/executor';
import { InMemoryItemRepository } from '../src/repository/in-memory-item-repository';

function expense(overrides: Partial<ExpenseItem> & { id: string }): ExpenseItem {
  return {
    type: 'expense',
    title: overrides.id,
    priority: 'normal',
    status: 'pending',
    outcome: null,
    requester: 'Maria Lopez',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:00:00.000Z',
    dueDate: null,
    lastAttempt: null,
    failureReason: null,
    payload: { merchant: 'Acme', category: 'Travel', amount: 10, currency: 'EUR' },
    ...overrides,
  };
}

function deployment(overrides: Partial<DeploymentItem> & { id: string }): DeploymentItem {
  return {
    ...expense({ id: overrides.id }),
    type: 'deployment',
    payload: {
      service: 'billing-api',
      environment: 'production',
      version: '2.4.0',
      failsFirstApproval: true,
    },
    ...overrides,
  };
}

class FakePublisher implements EventPublisher {
  readonly events: ItemEvent[] = [];
  publish(event: ItemEvent) {
    this.events.push(event);
  }
}

function setup(items: Item[], executor?: Executor) {
  const publisher = new FakePublisher();
  const app = createApp(new InMemoryItemRepository(items), executor, publisher);
  const act = (id: string, body: unknown) =>
    app.request(`/api/items/${id}/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  return { app, act, publisher };
}

describe('POST /api/items/:id/actions', () => {
  it('approving a pending expense completes it with outcome approved', async () => {
    const { act, app, publisher } = setup([expense({ id: 'e1' })]);

    const response = await act('e1', { action: 'approve' });

    expect(response.status).toBe(200);
    const item = itemSchema.parse(await response.json());
    expect(item).toMatchObject({
      status: 'completed',
      outcome: 'approved',
      lastAttempt: { action: 'approve', input: {} },
      failureReason: null,
    });
    expect(item.updatedAt).not.toBe('2026-10-28T09:00:00.000Z');
    const pending = await (await app.request('/api/items?status=pending')).json();
    expect(pending).toEqual({ items: [] });
    expect(publisher.events).toEqual([{ type: 'item.completed', item }]);
  });

  it('rejecting with a reason completes it with outcome rejected', async () => {
    const { act } = setup([expense({ id: 'e1' })]);

    const response = await act('e1', { action: 'reject', input: { reason: 'Over budget' } });

    expect(response.status).toBe(200);
    expect(itemSchema.parse(await response.json())).toMatchObject({
      status: 'completed',
      outcome: 'rejected',
      lastAttempt: { action: 'reject', input: { reason: 'Over budget' } },
    });
  });

  it.each([
    ['a missing reason', { action: 'reject' }],
    ['a blank reason', { action: 'reject', input: { reason: '   ' } }],
    ['an unknown action', { action: 'explode' }],
    ['a body without an action', {}],
  ])('rejects %s with 400 and leaves the item pending', async (_name, body) => {
    const { act, app, publisher } = setup([expense({ id: 'e1' })]);

    const response = await act('e1', body);

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(problemDetailsSchema.parse(await response.json()).status).toBe(400);
    expect(await (await app.request('/api/items/e1')).json()).toMatchObject({ status: 'pending' });
    expect(publisher.events).toEqual([]);
  });

  it('answers 400 to a body that is not JSON', async () => {
    const { app } = setup([expense({ id: 'e1' })]);
    const response = await app.request('/api/items/e1/actions', { method: 'POST', body: 'nope' });
    expect(response.status).toBe(400);
  });

  it('answers 404 for an unknown item', async () => {
    const { act } = setup([]);
    const response = await act('missing', { action: 'approve' });
    expect(response.status).toBe(404);
    expect(problemDetailsSchema.parse(await response.json()).status).toBe(404);
  });

  it.each(['completed', 'failed'] as const)(
    'answers 409 with the current status for an item that is %s',
    async (status) => {
      const { act, publisher } = setup([expense({ id: 'e1', status })]);

      const response = await act('e1', { action: 'approve' });

      expect(response.status).toBe(409);
      expect(problemDetailsSchema.parse(await response.json())).toMatchObject({
        status: 409,
        itemStatus: status,
      });
      expect(publisher.events).toEqual([]);
    },
  );

  it('answers 409 when the same item is approved twice', async () => {
    const { act } = setup([expense({ id: 'e1' })]);
    await act('e1', { action: 'approve' });
    const second = await act('e1', { action: 'approve' });
    expect(second.status).toBe(409);
    expect(problemDetailsSchema.parse(await second.json()).itemStatus).toBe('completed');
  });

  it('records an executor failure as a failed item with status 200', async () => {
    const failing: Executor = { execute: async () => ({ ok: false, reason: 'Payroll is down' }) };
    const { act, publisher } = setup([expense({ id: 'e1' })], failing);

    const response = await act('e1', { action: 'approve' });

    expect(response.status).toBe(200);
    const item = itemSchema.parse(await response.json());
    expect(item).toMatchObject({
      status: 'failed',
      outcome: null,
      failureReason: 'Payroll is down',
      lastAttempt: { action: 'approve', input: {} },
    });
    expect(item.updatedAt).not.toBe('2026-10-28T09:00:00.000Z');
    expect(publisher.events).toEqual([{ type: 'item.failed', item }]);
  });

  describe('deployments', () => {
    it('requires a comment to request changes, then completes as rejected', async () => {
      const { act } = setup([deployment({ id: 'd1' })]);

      expect((await act('d1', { action: 'request_changes' })).status).toBe(400);
      const response = await act('d1', {
        action: 'request_changes',
        input: { comment: 'Add a rollback plan' },
      });

      expect(response.status).toBe(200);
      expect(itemSchema.parse(await response.json())).toMatchObject({
        status: 'completed',
        outcome: 'rejected',
        lastAttempt: { action: 'request_changes', input: { comment: 'Add a rollback plan' } },
      });
    });

    it('approves a staging deployment straight away', async () => {
      const { act } = setup([
        deployment({
          id: 'd1',
          payload: { service: 'search', environment: 'staging', version: '1.0.0' },
        }),
      ]);
      const item = itemSchema.parse(await (await act('d1', { action: 'approve' })).json());
      expect(item).toMatchObject({ status: 'completed', outcome: 'approved' });
    });
  });

  describe('failure, retry and dismiss', () => {
    const failedFirstApproval = () => setup([deployment({ id: 'd1' })]);

    it('fails the first approval of a production deployment with status 200, then retry succeeds', async () => {
      const { act, publisher } = failedFirstApproval();

      const response = await act('d1', { action: 'approve' });

      expect(response.status).toBe(200);
      const failed = itemSchema.parse(await response.json());
      expect(failed).toMatchObject({
        status: 'failed',
        outcome: null,
        lastAttempt: { action: 'approve', input: {} },
      });
      expect(failed.failureReason).toEqual(expect.any(String));

      const retried = itemSchema.parse(await (await act('d1', { action: 'retry' })).json());
      expect(retried).toMatchObject({
        status: 'completed',
        outcome: 'approved',
        failureReason: null,
        lastAttempt: { action: 'approve', input: {} },
      });
      expect(publisher.events.map((e) => e.type)).toEqual(['item.failed', 'item.completed']);
    });

    it('stays failed when the replayed attempt fails again', async () => {
      const failing: Executor = { execute: async () => ({ ok: false, reason: 'Still down' }) };
      const { act } = setup(
        [
          expense({
            id: 'e1',
            status: 'failed',
            failureReason: 'Down',
            lastAttempt: { action: 'approve', input: {} },
          }),
        ],
        failing,
      );
      const item = itemSchema.parse(await (await act('e1', { action: 'retry' })).json());
      expect(item).toMatchObject({ status: 'failed', failureReason: 'Still down' });
    });

    it('dismisses a failed item as completed with outcome dismissed', async () => {
      const { act, app, publisher } = failedFirstApproval();
      await act('d1', { action: 'approve' });

      const response = await act('d1', { action: 'dismiss' });

      expect(response.status).toBe(200);
      const item = itemSchema.parse(await response.json());
      expect(item).toMatchObject({ status: 'completed', outcome: 'dismissed', failureReason: null });
      const completed = await (await app.request('/api/items?status=completed')).json();
      expect(completed).toMatchObject({ items: [{ id: 'd1' }] });
      expect(publisher.events.at(-1)).toEqual({ type: 'item.completed', item });
    });

    it.each(['approve', 'request_changes', 'explode'])(
      'answers 409 to %s on a failed item',
      async (action) => {
        const { act } = failedFirstApproval();
        await act('d1', { action: 'approve' });
        const response = await act('d1', { action, input: { comment: 'x' } });
        expect(response.status).toBe(409);
        expect(problemDetailsSchema.parse(await response.json()).itemStatus).toBe('failed');
      },
    );

    it('succeeds the first approval of a production deployment that is not flagged to fail', async () => {
      const { act } = setup([
        deployment({
          id: 'd2',
          payload: { service: 'billing-api', environment: 'production', version: '2.5.0' },
        }),
      ]);
      expect(itemSchema.parse(await (await act('d2', { action: 'approve' })).json())).toMatchObject({
        status: 'completed',
        outcome: 'approved',
      });
    });

    it('titles the 409 for a refused action on a failed item differently from an handled one', async () => {
      const { act } = failedFirstApproval();
      await act('d1', { action: 'approve' });
      const refused = problemDetailsSchema.parse(await (await act('d1', { action: 'approve' })).json());
      expect(refused.title).toBe('Action not available');
      await act('d1', { action: 'dismiss' });
      const handled = problemDetailsSchema.parse(await (await act('d1', { action: 'approve' })).json());
      expect(handled.title).toBe('Item already handled');
    });

    it('dismisses a failed item that has no last attempt, and answers 400 to retry on it', async () => {
      const failedNoAttempt = () => expense({ id: 'e1', status: 'failed', failureReason: 'Down' });
      const retry = setup([failedNoAttempt()]);
      expect((await retry.act('e1', { action: 'retry' })).status).toBe(400);
      const dismiss = setup([failedNoAttempt()]);
      const response = await dismiss.act('e1', { action: 'dismiss' });
      expect(response.status).toBe(200);
      expect(itemSchema.parse(await response.json())).toMatchObject({ outcome: 'dismissed' });
    });

    it.each(['retry', 'dismiss'])('answers 409 to %s on a completed item', async (action) => {
      const { act } = setup([expense({ id: 'e1', status: 'completed', outcome: 'approved' })]);
      const response = await act('e1', { action });
      expect(response.status).toBe(409);
      expect(problemDetailsSchema.parse(await response.json()).itemStatus).toBe('completed');
    });

    it.each(['retry', 'dismiss'])(
      'answers 400 to %s on a pending item, which has nothing to recover',
      async (action) => {
        const { act } = setup([expense({ id: 'e1' })]);
        expect((await act('e1', { action })).status).toBe(400);
      },
    );
  });
});

describe('POST /api/items/:id/actions on a documentation item', () => {
  const documentation = (): Item => ({
    ...expense({ id: 'd1' }),
    type: 'documentation',
    payload: { topic: 'Onboarding guide', audience: 'New hires' },
  } as Item);

  it('completes with outcome done when given a link and an optional note', async () => {
    const { act } = setup([documentation()]);

    const response = await act('d1', {
      action: 'submit',
      input: { link: 'https://docs.example.com/guide', note: 'Draft v2' },
    });

    expect(response.status).toBe(200);
    expect(itemSchema.parse(await response.json())).toMatchObject({
      status: 'completed',
      outcome: 'done',
      lastAttempt: {
        action: 'submit',
        input: { link: 'https://docs.example.com/guide', note: 'Draft v2' },
      },
    });
  });

  it('accepts a link without a note', async () => {
    const { act } = setup([documentation()]);
    const response = await act('d1', { action: 'submit', input: { link: 'https://a.example/x' } });
    expect(response.status).toBe(200);
  });

  it.each([
    ['a missing link', { action: 'submit' }],
    ['a blank link', { action: 'submit', input: { link: ' ' } }],
    ['a malformed link', { action: 'submit', input: { link: 'not a url' } }],
    ['a non-http link', { action: 'submit', input: { link: 'javascript:alert(1)' } }],
    ['an expense action', { action: 'approve' }],
  ])('rejects %s with 400', async (_name, body) => {
    const { act, app } = setup([documentation()]);
    expect((await act('d1', body)).status).toBe(400);
    expect(await (await app.request('/api/items/d1')).json()).toMatchObject({ status: 'pending' });
  });
});
