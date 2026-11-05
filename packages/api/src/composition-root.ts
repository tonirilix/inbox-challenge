import { Hono } from 'hono';
import { InMemoryItemRepository } from './repository/in-memory-item-repository';
import type { ItemRepository } from './repository/item-repository';
import { itemRoutes } from './routes/items';
import { seedItems } from './seed';
import { ItemService } from './service/item-service';

/**
 * The single place where the API is wired together.
 * Collaborators are passed as constructor arguments; new ports (executor,
 * event publisher) are added here.
 */
export function createApp(repository: ItemRepository = new InMemoryItemRepository(seedItems())) {
  const itemService = new ItemService(repository);

  return new Hono().route('/api/items', itemRoutes(itemService));
}
