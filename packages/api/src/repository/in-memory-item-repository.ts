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

  async get(id: string): Promise<Item | undefined> {
    return this.items.find((item) => item.id === id);
  }

  async save(item: Item): Promise<void> {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index === -1) this.items.push(item);
    else this.items[index] = item;
  }
}
