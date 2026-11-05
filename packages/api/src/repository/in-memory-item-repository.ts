import type { Item, Status } from '@inbox/contracts';
import type { ItemRepository } from './item-repository';

export class InMemoryItemRepository implements ItemRepository {
  private readonly items: Item[];

  constructor(items: Item[] = []) {
    this.items = [...items];
  }

  async list({ status }: { status?: Status } = {}): Promise<Item[]> {
    return this.items.filter((item) => status === undefined || item.status === status);
  }
}
