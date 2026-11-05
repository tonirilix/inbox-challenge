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
    input: z.object({
      reason: z.string().trim().min(1, 'Enter a reason for rejecting'),
    }),
  }),
]);

/** Approve a deployment, or send it back with a required comment. */
export const deploymentActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), input: noInput }),
  z.object({
    action: z.literal('request_changes'),
    input: z.object({
      comment: z.string().trim().min(1, 'Enter a comment describing the changes'),
    }),
  }),
]);

/** Actions every failed item accepts, whatever its type: replay the last attempt, or close it. */
export const recoveryActions = ['retry', 'dismiss'] as const;
export type RecoveryAction = (typeof recoveryActions)[number];
export const isRecoveryAction = (action: unknown): action is RecoveryAction =>
  recoveryActions.some((a) => a === action);
/** A documentation item accepts one action: submit a link, with an optional note. */
export const documentationActionSchema = z.object({
  action: z.literal('submit'),
  input: z.object({
    link: z
      .string()
      .trim()
      .min(1, 'Enter a link')
      .pipe(z.url({ protocol: /^https?$/, error: 'Enter a valid link starting with http:// or https://' })),
    note: z.string().trim().optional(),
  }),
});

/** Per item type, the schema of a valid action request. A missing type fails to compile. */
export const actionSchemas = {
  expense: expenseActionSchema,
  deployment: deploymentActionSchema,
  documentation: documentationActionSchema,
} as const satisfies Record<ItemType, z.ZodType>;

export type DocumentationActionRequest = z.input<typeof documentationActionSchema>;
export type ExpenseActionRequest = z.input<typeof expenseActionSchema>;

/** Body of `POST /api/items/:id/actions`; validated per item type with `actionSchemas`. */
export const actionRequestSchema = z.object({
  action: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
});
export type ActionRequest = z.input<typeof actionRequestSchema>;
