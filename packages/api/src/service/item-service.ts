import {
  actionRequestSchema,
  actionSchemas,
  statuses,
  type ActionRequest,
  type Item,
  type ItemCounts,
  type Status,
} from '@inbox/contracts';
import type { EventPublisher } from '../events/event-publisher';
import type { Executor } from '../executor/executor';
import type { ItemRepository } from '../repository/item-repository';
import { orderForView } from './order-items';

export class ItemService {
  constructor(
    private readonly repository: ItemRepository,
    private readonly executor: Executor,
    private readonly events: EventPublisher,
  ) {}

  async listItems(status: Status): Promise<Item[]> {
    return orderForView(status, await this.repository.list({ status }));
  }

  /** Counts per status. Deliberately takes no filters (spec: counts ignore filters). */
  async countItems(): Promise<ItemCounts> {
    const items = await this.repository.list();
    const counts = Object.fromEntries(statuses.map((s) => [s, 0])) as ItemCounts;
    for (const item of items) counts[item.status] += 1;
    return counts;
  }

  async getItem(id: string): Promise<Item> {
    const item = await this.repository.get(id);
    if (!item) throw new ItemNotFoundError(id);
    return item;
  }

  /**
   * Pending items accept any action of their type. Success completes the item
   * with the executor's outcome; an executor failure marks it failed (ADR 0003).
   */
  async submitAction(id: string, body: unknown): Promise<Item> {
    const item = await this.getItem(id);
    if (item.status !== 'pending') throw new ItemNotActionableError(item.status);

    const envelope = actionRequestSchema.safeParse(body);
    const typed = envelope.success ? actionSchemas[item.type].safeParse(envelope.data) : envelope;
    if (!typed.success) throw new InvalidActionError(typed.error.issues[0]?.message ?? 'Invalid action');
    const attempt = { action: typed.data.action, input: typed.data.input } as Required<ActionRequest>;

    const result = await this.executor.execute(item, attempt);
    const updated: Item = {
      ...item,
      status: result.ok ? 'completed' : 'failed',
      outcome: result.ok ? result.outcome : null,
      failureReason: result.ok ? null : result.reason,
      lastAttempt: attempt,
      updatedAt: new Date().toISOString(),
    };
    await this.repository.save(updated);
    await this.events.publish({ type: result.ok ? 'item.completed' : 'item.failed', item: updated });
    return updated;
  }
}

export class ItemNotFoundError extends Error {
  constructor(readonly itemId: string) {
    super(`No item with id "${itemId}"`);
  }
}

/** The item is not in a status that accepts the action. */
export class ItemNotActionableError extends Error {
  constructor(readonly currentStatus: Status) {
    super(`The item is ${currentStatus} and no longer accepts this action`);
  }
}

export class InvalidActionError extends Error {}
