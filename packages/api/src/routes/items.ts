import { Hono } from 'hono';
import type { ListItemsResponse } from '@inbox/contracts';
import { ItemNotFoundError, type ItemService } from '../service/item-service';
import { problem } from './problem';

export function itemRoutes(service: ItemService) {
  return new Hono()
    .get('/', async (c) => {
      const body: ListItemsResponse = { items: await service.listItems() };
      return c.json(body);
    })
    .get('/:id', async (c) => {
      try {
        return c.json(await service.getItem(c.req.param('id')));
      } catch (error) {
        if (error instanceof ItemNotFoundError) return problem(c, 404, 'Item not found', error.message);
        throw error;
      }
    });
}
