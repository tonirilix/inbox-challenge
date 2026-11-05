import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import {
  itemEnvelopeLooseSchema,
  type ActionRequest,
  type ItemEnvelope,
} from '@inbox/contracts';
import { useAnnounce } from '@/shared/a11y/announcer';
import { postJson } from '@/shared/api/client';
import { capitalize } from '../utils/format';
import { itemLinkId, focusElement } from '../utils/focus';
import type { ViewSlug } from '../views';
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
  const outcome = item.outcome ? capitalize(item.outcome) : 'Done';
  return `${outcome} “${item.title}”. ${next ? `Next: ${next.title}.` : 'No items remain.'}`;
}

/**
 * Submits an action. The item moves only when the server responds. On success
 * the outcome is announced and the view moves to the next item; after any result the
 * lists, counts and detail are refetched and, once they have, focus goes to the next item
 * (or the list heading if it is not there).
 */
export function useSubmitAction(item: ItemEnvelope, view: ViewSlug) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { search } = useLocation();
  const { filters } = useItemFilters();
  const nextId = useRef<string | undefined>(undefined);

  return useMutation({
    mutationFn: (request: ActionRequest) =>
      postJson(`/api/items/${encodeURIComponent(item.id)}/actions`, request, itemEnvelopeLooseSchema),
    onSuccess: (updated) => {
      const cached = queryClient.getQueryData<{ items: ItemEnvelope[] }>(
        itemKeys.list(view, filters),
      );
      const next = updated.status === 'failed' ? undefined : neighbour(cached?.items, item.id);
      nextId.current = next?.id;
      announce(outcomeMessage(updated, next));
      if (updated.status !== 'failed') {
        void navigate(`/${view}${next ? `/${encodeURIComponent(next.id)}` : ''}${search}`);
      }
    },
    onSettled: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: itemKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.counts() }),
        queryClient.invalidateQueries({ queryKey: itemKeys.detail(item.id) }),
      ]);
      // Focus once the lists have updated, so the target row exists (else the list heading).
      if (updated && updated.status !== 'failed') {
        setTimeout(() => focusElement(nextId.current ? itemLinkId(nextId.current) : undefined), 0);
      }
    },
  });
}
