import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import {
  itemEnvelopeLooseSchema,
  type ActionRequest,
  type ItemEnvelope,
  type Status,
} from '@inbox/contracts';
import { useAnnounce } from '@/shared/a11y/announcer';
import { postJson } from '@/shared/api/client';
import { itemLinkId, focusElement, LIST_HEADING_ID } from '../utils/focus';
import { useItemFilters } from './use-item-filters';
import { itemKeys } from './use-items';

/** The item after `id` in the cached list, else the one before it. */
function neighbour(items: ItemEnvelope[] | undefined, id: string) {
  const index = items?.findIndex((item) => item.id === id) ?? -1;
  if (!items || index === -1) return undefined;
  return items[index + 1] ?? items[index - 1];
}

function outcomeMessage(item: ItemEnvelope, next: ItemEnvelope | undefined) {
  if (item.status === 'failed') return `Could not complete “${item.title}”: ${item.failureReason}`;
  const outcome = item.outcome ? item.outcome[0]!.toUpperCase() + item.outcome.slice(1) : 'Done';
  return `${outcome} “${item.title}”. ${next ? `Next: ${next.title}.` : 'No items remain.'}`;
}

/**
 * Submits an action. The item moves only when the server responds. On success
 * focus goes to the next item (or the list heading) and the outcome is announced;
 * after any result the lists, counts and detail are refetched.
 */
export function useSubmitAction(item: ItemEnvelope, view: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { search } = useLocation();
  const { filters } = useItemFilters();

  return useMutation({
    mutationFn: (request: ActionRequest) =>
      postJson(`/api/items/${encodeURIComponent(item.id)}/actions`, request, itemEnvelopeLooseSchema),
    onSuccess: (updated) => {
      const cached = queryClient.getQueryData<{ items: ItemEnvelope[] }>(
        itemKeys.list(view as Status, filters),
      );
      const next = updated.status === 'failed' ? undefined : neighbour(cached?.items, item.id);
      announce(outcomeMessage(updated, next));
      if (updated.status !== 'failed') {
        focusElement(next ? itemLinkId(next.id) : LIST_HEADING_ID);
        void navigate(`/${view}${next ? `/${encodeURIComponent(next.id)}` : ''}${search}`);
      }
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: itemKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.counts() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.detail(item.id) }),
      ]),
  });
}
