import { Hono } from 'hono';
import {
  listItemsQuerySchema,
  type CountsResponse,
  type ListItemsResponse,
} from '@inbox/contracts';
import { ItemNotFoundError, type ItemService } from '../service/item-service';
import { problem } from './problem';

export function itemRoutes(service: ItemService) {
  return (
    new Hono()
      // Registered before `/:id` so "counts" is never read as an id.
      .get('/counts', async (c) => {
        const body: CountsResponse = { counts: await service.countItems() };
        return c.json(body);
      })
      .get('/', async (c) => {
        const query = listItemsQuerySchema.safeParse(c.req.query());
        if (!query.success)
          return problem(
            c,
            400,
            'Invalid query',
            query.error.issues
              .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
              .join('; '),
          );
        const body: ListItemsResponse = { items: await service.listItems(query.data) };
        return c.json(body);
      })
      .get('/:id', async (c) => {
        try {
          return c.json(await service.getItem(c.req.param('id')));
        } catch (error) {
          if (error instanceof ItemNotFoundError) {
            return problem(c, 404, 'Item not found', error.message);
          }
          throw error;
        }
      })
  );
}
