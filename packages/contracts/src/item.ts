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

export const deploymentItemSchema = itemEnvelopeSchema.extend({
  type: z.literal('deployment'),
  payload: z.object({
    service: z.string(),
    environment: z.enum(['production', 'staging']),
    version: z.string(),
  }),
});

export const documentationItemSchema = itemEnvelopeSchema.extend({
  type: z.literal('documentation'),
  payload: z.object({
    /** What needs documenting. */
    topic: z.string(),
    audience: z.string(),
  }),
});

export const itemSchema = z.discriminatedUnion('type', [
  expenseItemSchema,
  deploymentItemSchema,
  documentationItemSchema,
]);

export type Item = z.infer<typeof itemSchema>;
export type ItemType = Item['type'];
export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type DeploymentItem = z.infer<typeof deploymentItemSchema>;
export type DocumentationItem = z.infer<typeof documentationItemSchema>;

export const listItemsResponseSchema = z.object({ items: z.array(itemSchema) });
export type ListItemsResponse = z.infer<typeof listItemsResponseSchema>;

export const itemCountsSchema = z.record(statusSchema, z.number().int().nonnegative());
export const countsResponseSchema = z.object({ counts: itemCountsSchema });
export type ItemCounts = z.infer<typeof itemCountsSchema>;
export type CountsResponse = z.infer<typeof countsResponseSchema>;

export const itemTypes = itemSchema.options.map((option) => option.shape.type.value);
export const itemTypeSchema = z.enum(itemTypes as [ItemType, ...ItemType[]]);

/** An empty value means "no filter", so a cleared form field can be sent as is. */
const optionalFilter = <S extends z.ZodType>(schema: S) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

/** Query of the list endpoint: the view's status plus optional filters, combined with AND. */
export const listItemsQuerySchema = z.object({
  status: statusSchema,
  type: optionalFilter(itemTypeSchema),
  priority: optionalFilter(prioritySchema),
  /** Matches title and requester, case-insensitively. */
  q: optionalFilter(z.string().trim()),
});
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type ItemFilters = Omit<ListItemsQuery, 'status'>;

/**
 * Lenient item for readers that must tolerate item types they don't know yet:
 * the envelope plus whatever else the server sent (ADR 0002).
 */
export const itemEnvelopeLooseSchema = itemEnvelopeSchema.extend({ type: z.string() }).loose();
export type ItemEnvelope = z.infer<typeof itemEnvelopeLooseSchema>;

export const listItemEnvelopesResponseSchema = z.object({
  items: z.array(itemEnvelopeLooseSchema),
});

/** RFC 9457 Problem Details, the shape of every API error. */
export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  /** On a 409: the status the item is in now. */
  itemStatus: statusSchema.optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
