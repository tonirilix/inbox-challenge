import type { ItemEvent } from '@inbox/contracts';

/** Port: where the service reports what happened to items (ADR 0001). */
export interface EventPublisher {
  publish(event: ItemEvent): void | Promise<void>;
}
