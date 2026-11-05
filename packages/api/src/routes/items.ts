import { Hono } from 'hono';
import type { ListItemsResponse } from '@inbox/contracts';
import type { ItemService } from '../service/item-service';

export function itemRoutes(service: ItemService) {
  return new Hono().get('/', async (c) => {
    const body: ListItemsResponse = { items: await service.listItems() };
    return c.json(body);
  });
}
