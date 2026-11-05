import { describe, expect, it } from 'vitest';
import { countsResponseSchema, listItemsResponseSchema, type Item } from '@inbox/contracts';
import { createApp } from '../src/composition-root';
import { InMemoryItemRepository } from '../src/repository/in-memory-item-repository';

function item(overrides: Partial<Item> & { id: string }): Item {
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
    payload: {
      merchant: 'Acme',
      category: 'Travel',
      amount: 10,
      currency: 'EUR',
    },
    ...overrides,
  };
}

async function idsFor(app: ReturnType<typeof createApp>, status: string) {
  const response = await app.request(`/api/items?status=${status}`);
  expect(response.status).toBe(200);
  const { items } = listItemsResponseSchema.parse(await response.json());
  return items.map((i) => i.id);
}

describe('GET /api/items?status=', () => {
  it('lists the seeded items of a view as valid contract items', async () => {
    const response = await createApp().request('/api/items?status=pending');

    expect(response.status).toBe(200);
    const { items } = listItemsResponseSchema.parse(await response.json());
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.status === 'pending')).toBe(true);
  });

  it('orders Pending by priority, then earliest due date (none last), then oldest', async () => {
    const app = createApp(
      new InMemoryItemRepository([
        item({ id: 'normal-early', dueDate: '2026-11-01' }),
        item({ id: 'low', priority: 'low' }),
        item({ id: 'urgent-late', priority: 'urgent', dueDate: '2026-12-01' }),
        item({ id: 'urgent-early', priority: 'urgent', dueDate: '2026-11-02' }),
        item({
          id: 'urgent-none-new',
          priority: 'urgent',
          createdAt: '2026-10-30T09:00:00.000Z',
        }),
        item({ id: 'urgent-none-old', priority: 'urgent' }),
        item({ id: 'high', priority: 'high' }),
      ]),
    );

    expect(await idsFor(app, 'pending')).toEqual([
      'urgent-early',
      'urgent-late',
      'urgent-none-old',
      'urgent-none-new',
      'high',
      'normal-early',
      'low',
    ]);
  });

  it('orders Failed by most recently failed and Completed by most recently completed', async () => {
    const app = createApp(
      new InMemoryItemRepository([
        item({
          id: 'f-old',
          status: 'failed',
          updatedAt: '2026-11-01T09:00:00.000Z',
        }),
        item({
          id: 'f-new',
          status: 'failed',
          updatedAt: '2026-11-03T09:00:00.000Z',
        }),
        item({
          id: 'c-old',
          status: 'completed',
          outcome: 'done',
          updatedAt: '2026-11-01T09:00:00.000Z',
        }),
        item({
          id: 'c-new',
          status: 'completed',
          outcome: 'done',
          updatedAt: '2026-11-03T09:00:00.000Z',
        }),
      ]),
    );

    expect(await idsFor(app, 'failed')).toEqual(['f-new', 'f-old']);
    expect(await idsFor(app, 'completed')).toEqual(['c-new', 'c-old']);
  });

  it('rejects an unknown status', async () => {
    const response = await createApp().request('/api/items?status=bogus');
    expect(response.status).toBe(400);
  });
});

describe('GET /api/items/counts', () => {
  it('returns the number of items per status, ignoring any filters', async () => {
    const app = createApp(
      new InMemoryItemRepository([
        item({ id: 'a' }),
        item({ id: 'b' }),
        item({ id: 'c', status: 'failed' }),
        item({ id: 'd', status: 'completed', outcome: 'done' }),
      ]),
    );

    const response = await app.request('/api/items/counts?status=failed&priority=urgent');

    expect(response.status).toBe(200);
    expect(countsResponseSchema.parse(await response.json()).counts).toEqual({
      pending: 2,
      processing: 0,
      completed: 1,
      failed: 1,
    });
  });
});

describe('seed data', () => {
  it('covers every status, all priorities, an overdue item and different outcomes', async () => {
    const app = createApp();
    const all = (
      await Promise.all(
        ['pending', 'processing', 'completed', 'failed'].map(async (s) => {
          const r = await app.request(`/api/items?status=${s}`);
          return listItemsResponseSchema.parse(await r.json()).items;
        }),
      )
    ).flat();

    expect(new Set(all.map((i) => i.status)).size).toBe(4);
    expect(new Set(all.map((i) => i.priority)).size).toBe(4);
    const today = new Date().toISOString().slice(0, 10);
    expect(all.some((i) => i.status === 'pending' && i.dueDate !== null && i.dueDate < today)).toBe(
      true,
    );
    const outcomes = new Set(all.filter((i) => i.status === 'completed').map((i) => i.outcome));
    expect(outcomes.size).toBeGreaterThanOrEqual(2);
  });
});
