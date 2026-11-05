import type { ItemEvent } from '@inbox/contracts';
import type { EventPublisher } from './event-publisher';

/** v1 publisher: nothing subscribes yet; realtime delivery plugs in here later. */
export class InProcessEventPublisher implements EventPublisher {
  private readonly subscribers = new Set<(event: ItemEvent) => void>();

  subscribe(listener: (event: ItemEvent) => void) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  publish(event: ItemEvent) {
    for (const listener of this.subscribers) listener(event);
  }
}
