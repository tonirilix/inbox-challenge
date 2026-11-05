import { Hono } from 'hono';
import {
  listItemsQuerySchema,
  type CountsResponse,
  type ListItemsResponse,
} from '@inbox/contracts';
import type { ItemService } from '../service/item-service';

export function itemRoutes(service: ItemService) {
  return (
    new Hono()
      // Registered before any `/:id` route so "counts" is never read as an id.
      .get('/counts', async (c) => {
        const body: CountsResponse = { counts: await service.countItems() };
        return c.json(body);
      })
      .get('/', async (c) => {
        const query = listItemsQuerySchema.safeParse(c.req.query());
        if (!query.success) return c.json({ error: 'Invalid or missing status' }, 400);
        const body: ListItemsResponse = {
          items: await service.listItems(query.data.status),
        };
        return c.json(body);
      })
  );
}
