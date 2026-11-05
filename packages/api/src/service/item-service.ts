import { randomUUID } from "node:crypto";
import {
  actionRequestSchema,
  createItemRequestSchema,
  actionSchemas,
  isRecoveryAction,
  statuses,
  type ActionRequest,
  type Item,
  type ItemCounts,
  type ListItemsQuery,
  type Status,
} from "@inbox/contracts";
import type { EventPublisher } from "../events/event-publisher";
import type { Executor } from "../executor/executor";
import type { ItemRepository } from "../repository/item-repository";
import { orderForView } from "./order-items";

export class ItemService {
  constructor(
    private readonly repository: ItemRepository,
    private readonly executor: Executor,
    private readonly events: EventPublisher,
  ) {}

  async listItems(query: ListItemsQuery): Promise<Item[]> {
    return orderForView(query.status, await this.repository.list(query));
  }

  /** Counts per status. Deliberately takes no filters (spec: counts ignore filters). */
  async countItems(): Promise<ItemCounts> {
    const items = await this.repository.list();
    const counts = Object.fromEntries(
      statuses.map((s) => [s, 0]),
    ) as ItemCounts;
    for (const item of items) counts[item.status] += 1;
    return counts;
  }

  async getItem(id: string): Promise<Item> {
    const item = await this.repository.get(id);
    if (!item) throw new ItemNotFoundError(id);
    return item;
  }

  /**
   * Pending items accept any action of their type; failed items accept only Retry
   * and Dismiss. Success completes the item with the executor's outcome; an
   * executor failure marks it failed (ADR 0003).
   */
  async submitAction(id: string, body: unknown): Promise<Item> {
    const item = await this.getItem(id);
    const envelope = actionRequestSchema.safeParse(body);
    const recovery =
      item.status === "failed" &&
      envelope.success &&
      isRecoveryAction(envelope.data.action)
        ? envelope.data.action
        : undefined;
    if (item.status !== "pending" && !recovery)
      throw new ItemNotActionableError(item.status);

    if (recovery === "dismiss") {
      return this.save({
        ...item,
        status: "completed",
        outcome: "dismissed",
        failureReason: null,
      });
    }

    let attempt: Required<ActionRequest>;
    if (recovery) {
      if (!item.lastAttempt) throw new ItemNotActionableError(item.status);
      attempt = item.lastAttempt;
    } else {
      const typed = envelope.success
        ? actionSchemas[item.type].safeParse(envelope.data)
        : envelope;
      if (!typed.success)
        throw new InvalidActionError(
          typed.error.issues[0]?.message ?? "Invalid action",
        );
      attempt = {
        action: typed.data.action,
        input: typed.data.input,
      } as Required<ActionRequest>;
    }

    const result = await this.executor.execute(item, attempt);
    return this.save({
      ...item,
      status: result.ok ? "completed" : "failed",
      outcome: result.ok ? result.outcome : null,
      failureReason: result.ok ? null : result.reason,
      lastAttempt: attempt,
    });
  }

  /** Raises a pending item from an intake request validated against its type's contract. */
  async createItem(body: unknown): Promise<Item> {
    const request = createItemRequestSchema.safeParse(body);
    if (!request.success)
      throw new InvalidItemError(
        request.error.issues
          .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
          .join("; "),
      );
    const now = new Date().toISOString();
    const item = {
      ...request.data,
      id: randomUUID(),
      status: "pending",
      outcome: null,
      createdAt: now,
      updatedAt: now,
      lastAttempt: null,
      failureReason: null,
    } as Item;
    await this.repository.save(item);
    await this.events.publish({ type: "item.created", item });
    return item;
  }

  /** Stamps the transition, persists it and publishes the matching event. */
  private async save(updated: Item): Promise<Item> {
    const saved: Item = { ...updated, updatedAt: new Date().toISOString() };
    await this.repository.save(saved);
    await this.events.publish({
      type: saved.status === "completed" ? "item.completed" : "item.failed",
      item: saved,
    });
    return saved;
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

/** An intake request that doesn't match the contract of its type. */
export class InvalidItemError extends Error {}
