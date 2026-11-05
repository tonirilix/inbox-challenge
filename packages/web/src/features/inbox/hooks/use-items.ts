import { useQuery } from '@tanstack/react-query';
import { listItemsResponseSchema } from '@inbox/contracts';
import { getJson } from '@/shared/api/client';

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
};

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: () => getJson('/api/items', listItemsResponseSchema),
    select: (data) => data.items,
  });
}
