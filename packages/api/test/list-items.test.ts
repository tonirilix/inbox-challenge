import { describe, expect, it } from 'vitest';
import { listItemsResponseSchema } from '@inbox/contracts';
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
