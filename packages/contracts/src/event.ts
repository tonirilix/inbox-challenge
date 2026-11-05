import { z } from 'zod';
import { itemSchema } from './item';

/** Events the service publishes about item changes (ADR 0001). */
export const itemEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('item.completed'), item: itemSchema }),
  z.object({ type: z.literal('item.failed'), item: itemSchema }),
]);
export type ItemEvent = z.infer<typeof itemEventSchema>;
