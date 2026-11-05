import type { ActionRequest, Item, Outcome } from '@inbox/contracts';

export type ExecutionResult = { ok: true; outcome: Outcome } | { ok: false; reason: string };

/**
 * Port: carries out a validated action on an item (ADR 0001). v1 runs inline;
 * a worker-based executor can replace it without touching the service.
 */
export interface Executor {
  execute(item: Item, attempt: Required<ActionRequest>): Promise<ExecutionResult>;
}
