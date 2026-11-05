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
};

export class InlineExecutor implements Executor {
  execute(...args: Parameters<TypeExecutor>) {
    return typeExecutors[args[0].type](...args);
  }
}
