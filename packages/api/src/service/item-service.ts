import type { Item } from '@inbox/contracts';
import type { ItemRepository } from '../repository/item-repository';

export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  listItems(): Promise<Item[]> {
    return this.repository.list();
  }
}
