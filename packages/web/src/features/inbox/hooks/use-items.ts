import { useQuery } from '@tanstack/react-query';
import {
  countsResponseSchema,
  itemEnvelopeLooseSchema,
  listItemEnvelopesResponseSchema,
  type ItemFilters,
  type Status,
} from '@inbox/contracts';
import { getJson } from '@/shared/api/client';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (status: Status, filters: ItemFilters = {}) =>
    [...itemKeys.lists(), status, filters] as const,
  counts: () => [...itemKeys.all, 'counts'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

// Items are read leniently (envelope only) so a type this app doesn't know yet still lists.
export function useItems(status: Status, filters: ItemFilters = {}) {
  const query = new URLSearchParams({ status });
  for (const key of ['type', 'priority', 'q'] as const) {
    const value = filters[key];
    if (value) query.set(key, value);
  }
  return useQuery({
    queryKey: itemKeys.list(status, filters),
    queryFn: () => getJson(`/api/items?${query}`, listItemEnvelopesResponseSchema),
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
