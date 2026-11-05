/** Ids used to move focus after an item is handled. */
export const LIST_HEADING_ID = 'list-heading';
export const itemLinkId = (itemId: string) => `item-link-${itemId}`;

/** Focuses the element with `id`, falling back to the list heading. */
export function focusElement(id?: string) {
  (
    (id && document.getElementById(id)) ||
    document.getElementById(LIST_HEADING_ID)
  )?.focus();
}
