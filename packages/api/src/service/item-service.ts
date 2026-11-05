import type { Item } from '@inbox/contracts';
import type { ItemRepository } from '../repository/item-repository';

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  listItems(): Promise<Item[]> {
    return this.repository.list();
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
