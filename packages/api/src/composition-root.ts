import { Hono } from 'hono';
import { InProcessEventPublisher } from './events/in-process-event-publisher';
import type { EventPublisher } from './events/event-publisher';
import type { Executor } from './executor/executor';
import { InlineExecutor } from './executor/inline-executor';
import { InMemoryItemRepository } from './repository/in-memory-item-repository';
import type { ItemRepository } from './repository/item-repository';
import { itemRoutes } from './routes/items';
import { seedItems } from './seed';
import { ItemService } from './service/item-service';

/**
 * The single place where the API is wired together.
 * Collaborators (repository and the executor and event publisher ports) are
 * constructor arguments with production defaults; tests pass fakes.
 */
export function createApp(
  repository: ItemRepository = new InMemoryItemRepository(seedItems()),
  executor: Executor = new InlineExecutor(),
  events: EventPublisher = new InProcessEventPublisher(),
) {
  const itemService = new ItemService(repository, executor, events);

  return new Hono().route('/api/items', itemRoutes(itemService));
}
