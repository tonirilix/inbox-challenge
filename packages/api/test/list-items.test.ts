import { describe, expect, it } from 'vitest';
import { itemSchema, listItemsResponseSchema, problemDetailsSchema } from '@inbox/contracts';
import { createApp } from '../src/composition-root';

describe('GET /api/items', () => {
  it('lists the seeded items as valid contract items', async () => {
    const app = createApp();

    const response = await app.request('/api/items');

    expect(response.status).toBe(200);
    const { items } = listItemsResponseSchema.parse(await response.json());
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.type === 'expense')).toBe(true);
  });
});

describe('GET /api/items/:id', () => {
  it('returns the item', async () => {
    const response = await createApp().request('/api/items/exp-1');

    expect(response.status).toBe(200);
    expect(itemSchema.parse(await response.json())).toMatchObject({ id: 'exp-1', type: 'expense' });
  });

  it('responds 404 as Problem Details for an unknown id', async () => {
    const response = await createApp().request('/api/items/nope');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(problemDetailsSchema.parse(await response.json())).toMatchObject({ status: 404 });
  });
});
