import { useQuery } from '@tanstack/react-query';
import { itemEnvelopeLooseSchema, listItemEnvelopesResponseSchema } from '@inbox/contracts';
import { getJson } from '@/shared/api/client';

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

// Items are read leniently (envelope only) so a type this app doesn't know yet still lists.
export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: () => getJson('/api/items', listItemEnvelopesResponseSchema),
    select: (data) => data.items,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => getJson(`/api/items/${encodeURIComponent(id)}`, itemEnvelopeLooseSchema),
  });
}
