import { z } from 'zod';

export const priorities = ['urgent', 'high', 'normal', 'low'] as const;
export const statuses = ['pending', 'processing', 'completed', 'failed'] as const;
export const outcomes = ['approved', 'rejected', 'done', 'dismissed'] as const;

export const prioritySchema = z.enum(priorities);
export const statusSchema = z.enum(statuses);
export const outcomeSchema = z.enum(outcomes);

export type Priority = z.infer<typeof prioritySchema>;
export type Status = z.infer<typeof statusSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;

/** The last action and input a user submitted on an item. */
export const attemptSchema = z.object({
  action: z.string(),
  input: z.record(z.string(), z.unknown()),
});

/** Fields shared by every item, whatever its type. */
export const itemEnvelopeSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: prioritySchema,
  status: statusSchema,
  outcome: outcomeSchema.nullable(),
  requester: z.string(),
  createdAt: z.iso.datetime(),
  /** When the item last changed status; orders the Failed and Completed views. */
  updatedAt: z.iso.datetime(),
  dueDate: z.iso.date().nullable(),
  lastAttempt: attemptSchema.nullable(),
  failureReason: z.string().nullable(),
});

/**
 * One schema per item type: the envelope plus a typed payload.
 * To add a type, define its schema here and add it to `itemSchema` below (ADR 0002).
 */
export const expenseItemSchema = itemEnvelopeSchema.extend({
  type: z.literal('expense'),
  payload: z.object({
    merchant: z.string(),
    category: z.string(),
    amount: z.number().positive(),
    currency: z.string().length(3),
  }),
});

export const itemSchema = z.discriminatedUnion('type', [expenseItemSchema]);

export type Item = z.infer<typeof itemSchema>;
export type ItemType = Item['type'];
export type ExpenseItem = z.infer<typeof expenseItemSchema>;

export const listItemsResponseSchema = z.object({ items: z.array(itemSchema) });
export type ListItemsResponse = z.infer<typeof listItemsResponseSchema>;

export const itemCountsSchema = z.record(statusSchema, z.number().int().nonnegative());
export const countsResponseSchema = z.object({ counts: itemCountsSchema });
export type ItemCounts = z.infer<typeof itemCountsSchema>;
export type CountsResponse = z.infer<typeof countsResponseSchema>;

export const listItemsQuerySchema = z.object({ status: statusSchema });

/**
 * Lenient item for readers that must tolerate item types they don't know yet:
 * the envelope plus whatever else the server sent (ADR 0002).
 */
export const itemEnvelopeLooseSchema = itemEnvelopeSchema.extend({ type: z.string() }).loose();
export type ItemEnvelope = z.infer<typeof itemEnvelopeLooseSchema>;

export const listItemEnvelopesResponseSchema = z.object({ items: z.array(itemEnvelopeLooseSchema) });

/** RFC 9457 Problem Details, the shape of every API error. */
export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
