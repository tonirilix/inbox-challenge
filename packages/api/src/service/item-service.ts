import { statuses, type Item, type ItemCounts, type ListItemsQuery } from '@inbox/contracts';
import type { ItemRepository } from '../repository/item-repository';
import { orderForView } from './order-items';

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  async listItems(query: ListItemsQuery): Promise<Item[]> {
    return orderForView(query.status, await this.repository.list(query));
  }

  /** Counts per status. Deliberately takes no filters (spec: counts ignore filters). */
  async countItems(): Promise<ItemCounts> {
    const items = await this.repository.list();
    const counts = Object.fromEntries(statuses.map((s) => [s, 0])) as ItemCounts;
    for (const item of items) counts[item.status] += 1;
    return counts;
  }

  async getItem(id: string): Promise<Item> {
    const item = await this.repository.get(id);
    if (!item) throw new ItemNotFoundError(id);
    return item;
  }
}

export class ItemNotFoundError extends Error {
  constructor(readonly itemId: string) {
    super(`No item with id "${itemId}"`);
  }
}
