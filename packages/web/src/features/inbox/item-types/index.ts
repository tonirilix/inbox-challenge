import type { ComponentType } from 'react';
import type { Item, ItemType } from '@inbox/contracts';
import { ExpenseDetail } from './expense-detail';

/**
 * What the web app needs to know about each item type. Typed as a full record
 * so adding a type to the contracts fails to compile until it is registered
 * here (ADR 0002). Later tickets add the action form.
 */
export interface ItemTypeModule<T extends Item = Item> {
  label: string;
  /** The type-specific part of the detail; the common envelope is rendered around it. */
  Detail: ComponentType<{ item: T }>;
}

export const itemTypeModules: { [K in ItemType]: ItemTypeModule<Extract<Item, { type: K }>> } = {
  expense: { label: 'Expense', Detail: ExpenseDetail },
};

export function isKnownItemType(type: string): type is ItemType {
  return Object.hasOwn(itemTypeModules, type);
}

/** Label for any type; unknown types show their raw name. */
export function itemTypeLabel(type: string): string {
  return isKnownItemType(type) ? itemTypeModules[type].label : type;
}
