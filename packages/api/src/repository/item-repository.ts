import type { Item } from '@inbox/contracts';

export interface ItemRepository {
  list(): Promise<Item[]>;
}
