import type { Item, ItemFilters, Status } from '@inbox/contracts';

export interface ItemRepository {
  list(query?: { status?: Status } & ItemFilters): Promise<Item[]>;
  get(id: string): Promise<Item | undefined>;
  /** Replaces the stored item with the same id. */
  save(item: Item): Promise<void>;
}
