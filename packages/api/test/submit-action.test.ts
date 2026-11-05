import { describe, expect, it } from 'vitest';
import { itemSchema, problemDetailsSchema, type ExpenseItem, type Item, type ItemEvent } from '@inbox/contracts';
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
