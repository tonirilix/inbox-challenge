import { describe, expect, it } from 'vitest';
import {
  countsResponseSchema,
  listItemsResponseSchema,
  problemDetailsSchema,
  type Item,
} from '@inbox/contracts';
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
    payload: { merchant: 'Acme', category: 'Travel', amount: 10, currency: 'EUR' },
    ...overrides,
  };
}

const app = () =>
  createApp(
    new InMemoryItemRepository([
      item({ id: 'a', title: 'Approve Acme flights', priority: 'urgent' }),
      item({ id: 'b', title: 'Approve monitor', requester: 'Tom Becker', priority: 'urgent' }),
      item({ id: 'c', title: 'Approve lunch', requester: 'Tom Becker', priority: 'low' }),
      item({ id: 'd', title: 'Acme invoice', status: 'failed', priority: 'urgent' }),
    ]),
  );

async function ids(query: string) {
  const response = await app().request(`/api/items?${query}`);
  expect(response.status).toBe(200);
  return listItemsResponseSchema
    .parse(await response.json())
    .items.map((i) => i.id)
    .sort();
}

describe('GET /api/items filters', () => {
  it('filters by priority', async () => {
    expect(await ids('status=pending&priority=urgent')).toEqual(['a', 'b']);
  });

  it('filters by type', async () => {
    expect(await ids('status=pending&type=expense')).toEqual(['a', 'b', 'c']);
  });

  it('searches title and requester, case-insensitively', async () => {
    expect(await ids('status=pending&q=ACME')).toEqual(['a']);
    expect(await ids('status=pending&q=becker')).toEqual(['b', 'c']);
  });

  it('combines filters with AND, within the status', async () => {
    expect(await ids('status=pending&priority=urgent&q=becker&type=expense')).toEqual(['b']);
    expect(await ids('status=pending&priority=low&q=acme')).toEqual([]);
    expect(await ids('status=failed&q=acme')).toEqual(['d']);
  });

  it('treats empty filter values as absent', async () => {
    expect(await ids('status=pending&priority=&q=&type=')).toEqual(['a', 'b', 'c']);
  });

  it.each(['priority=blocker', 'type=poem'])('rejects invalid %s as Problem Details', async (q) => {
    const response = await app().request(`/api/items?status=pending&${q}`);

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(problemDetailsSchema.parse(await response.json())).toMatchObject({ status: 400 });
  });

  it('leaves counts unfiltered', async () => {
    const response = await app().request('/api/items/counts?priority=low&q=zzz');

    expect(countsResponseSchema.parse(await response.json()).counts).toMatchObject({
      pending: 3,
      failed: 1,
    });
  });
});
