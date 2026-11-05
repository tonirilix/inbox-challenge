import { z } from 'zod';
import type { ItemType } from './item';

const noInput = z.object({}).default({});

/**
 * The actions an expense accepts, each with its input. To add an item type,
 * define its action schema here and register it in `actionSchemas` (ADR 0002).
 */
export const expenseActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), input: noInput }),
  z.object({
    action: z.literal('reject'),
    input: z.object({ reason: z.string().trim().min(1, 'Enter a reason for rejecting') }),
  }),
]);

/** Per item type, the schema of a valid action request. A missing type fails to compile. */
export const actionSchemas = {
  expense: expenseActionSchema,
} as const satisfies Record<ItemType, z.ZodType>;

export type ExpenseActionRequest = z.input<typeof expenseActionSchema>;

/** Body of `POST /api/items/:id/actions`; validated per item type with `actionSchemas`. */
export const actionRequestSchema = z.object({
  action: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
});
export type ActionRequest = z.input<typeof actionRequestSchema>;
