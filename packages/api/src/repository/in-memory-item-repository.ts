import type { Item } from '@inbox/contracts';
import type { ItemRepository } from './item-repository';

export class InMemoryItemRepository implements ItemRepository {
  private readonly items: Item[];

  constructor(items: Item[] = []) {
    this.items = [...items];
  }

  async list(): Promise<Item[]> {
    return [...this.items];
  }

  async get(id: string): Promise<Item | undefined> {
    return this.items.find((item) => item.id === id);
  }
}
