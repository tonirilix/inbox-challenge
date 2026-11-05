import { useQuery } from '@tanstack/react-query';
import {
  countsResponseSchema,
  itemEnvelopeLooseSchema,
  listItemEnvelopesResponseSchema,
  type Status,
} from '@inbox/contracts';
import { getJson } from '@/shared/api/client';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (status: Status) => [...itemKeys.lists(), status] as const,
  counts: () => [...itemKeys.all, 'counts'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

// Items are read leniently (envelope only) so a type this app doesn't know yet still lists.
export function useItems(status: Status) {
  return useQuery({
    queryKey: itemKeys.list(status),
    queryFn: () => getJson(`/api/items?status=${status}`, listItemEnvelopesResponseSchema),
    select: (data) => data.items,
  });
}

export function useCounts() {
  return useQuery({
    queryKey: itemKeys.counts(),
    queryFn: () => getJson('/api/items/counts', countsResponseSchema),
    select: (data) => data.counts,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => getJson(`/api/items/${encodeURIComponent(id)}`, itemEnvelopeLooseSchema),
  });
}
