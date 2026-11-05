import type { Item, Status } from '@inbox/contracts';

export interface ItemRepository {
  list(query?: { status?: Status }): Promise<Item[]>;
  get(id: string): Promise<Item | undefined>;
}
