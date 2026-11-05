import type { ComponentType } from 'react';
import type { ActionRequest, Item, ItemType } from '@inbox/contracts';
import { DeploymentActionForm } from './deployment-action-form';
import { DeploymentDetail } from './deployment-detail';
import { ExpenseActionForm } from './expense-action-form';
import { ExpenseDetail } from './expense-detail';

/**
 * What the web app needs to know about each item type. Typed as a full record
 * so adding a type to the contracts fails to compile until it is registered
 * here (ADR 0002). The action form gathers an action's input and hands over a request; the
 * server validates it again.
 */
export interface ActionFormProps<T extends Item = Item> {
  item: T;
  /** Disabled while an action is in flight. */
  disabled: boolean;
  onSubmit: (request: ActionRequest) => void;
}

export interface ItemTypeModule<T extends Item = Item> {
  label: string;
  /** The type-specific part of the detail; the common envelope is rendered around it. */
  Detail: ComponentType<{ item: T }>;
  /** The controls for the actions the type offers; shown only while the item is pending. */
  ActionForm: ComponentType<ActionFormProps<T>>;
}

export const itemTypeModules: { [K in ItemType]: ItemTypeModule<Extract<Item, { type: K }>> } = {
  expense: { label: 'Expense', Detail: ExpenseDetail, ActionForm: ExpenseActionForm },
  deployment: {
    label: 'Deployment',
    Detail: DeploymentDetail,
    ActionForm: DeploymentActionForm,
  },
};

export function isKnownItemType(type: string): type is ItemType {
  return Object.hasOwn(itemTypeModules, type);
}

/** Label for any type; unknown types show their raw name. */
export function itemTypeLabel(type: string): string {
  return isKnownItemType(type) ? itemTypeModules[type].label : type;
}
