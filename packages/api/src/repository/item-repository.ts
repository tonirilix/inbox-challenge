import type { Item, ItemFilters, Status } from '@inbox/contracts';

export interface ItemRepository {
  list(query?: { status?: Status } & ItemFilters): Promise<Item[]>;
  get(id: string): Promise<Item | undefined>;
}
