import type { ItemType } from '@inbox/contracts';

/**
 * What the web app needs to know about each item type. Typed as a full record
 * so adding a type to the contracts fails to compile until it is registered
 * here (ADR 0002). Later tickets add the detail view and action form.
 */
export interface ItemTypeModule {
  label: string;
}

export const itemTypeModules: Record<ItemType, ItemTypeModule> = {
  expense: { label: 'Expense' },
};
