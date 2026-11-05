import type { ItemType } from '@inbox/contracts';
import type { ExecutionResult, Executor } from './executor';

type TypeExecutor = Executor['execute'];

/**
 * One executor per item type; the full Record makes a missing one a compile
 * error (ADR 0002). The action is already validated by the service.
 */
const typeExecutors: Record<ItemType, TypeExecutor> = {
  expense: async (_item, { action }): Promise<ExecutionResult> => ({
    ok: true,
    outcome: action === 'approve' ? 'approved' : 'rejected',
  }),
  // Deterministic, no randomness: a production deployment's first approval fails; the
  // retry replays an item that already has a last attempt, so it succeeds.
  deployment: async (item, { action }): Promise<ExecutionResult> => {
    if (
      action === 'approve' &&
      item.type === 'deployment' &&
      item.payload.environment === 'production' &&
      !item.lastAttempt
    ) {
      return {
        ok: false,
        reason: 'The deploy pipeline timed out waiting for the production lock.',
      };
    }
    return {
      ok: true,
      outcome: action === 'approve' ? 'approved' : 'rejected',
    };
  },
  documentation: async (): Promise<ExecutionResult> => ({ ok: true, outcome: 'done' }),
};

export class InlineExecutor implements Executor {
  execute(...args: Parameters<TypeExecutor>) {
    return typeExecutors[args[0].type](...args);
  }
}
