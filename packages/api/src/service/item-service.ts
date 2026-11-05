import { statuses, type Item, type ItemCounts, type Status } from '@inbox/contracts';
import type { ItemRepository } from '../repository/item-repository';
import { orderForView } from './order-items';

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  async listItems(status: Status): Promise<Item[]> {
    return orderForView(status, await this.repository.list({ status }));
  }

  /** Counts per status. Deliberately takes no filters (spec: counts ignore filters). */
  async countItems(): Promise<ItemCounts> {
    const items = await this.repository.list();
    const counts = Object.fromEntries(statuses.map((s) => [s, 0])) as ItemCounts;
    for (const item of items) counts[item.status] += 1;
    return counts;
  }
}
