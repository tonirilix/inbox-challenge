import { useQuery } from '@tanstack/react-query';
import { countsResponseSchema, listItemsResponseSchema, type Status } from '@inbox/contracts';
import { getJson } from '@/shared/api/client';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (status: Status) => [...itemKeys.lists(), status] as const,
  counts: () => [...itemKeys.all, 'counts'] as const,
};

export function useItems(status: Status) {
  return useQuery({
    queryKey: itemKeys.list(status),
    queryFn: () => getJson(`/api/items?status=${status}`, listItemsResponseSchema),
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
