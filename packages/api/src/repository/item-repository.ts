import type { Item } from '@inbox/contracts';

export interface ItemRepository {
  list(): Promise<Item[]>;
  get(id: string): Promise<Item | undefined>;
}
