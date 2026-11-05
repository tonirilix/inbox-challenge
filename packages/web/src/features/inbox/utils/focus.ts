/** Ids used to move focus after an item is handled. */
export const LIST_HEADING_ID = 'list-heading';
export const itemLinkId = (itemId: string) => `item-link-${itemId}`;

export function focusElement(id: string) {
  document.getElementById(id)?.focus();
}
