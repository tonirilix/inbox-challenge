import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { listItemsQuerySchema, type ItemFilters } from '@inbox/contracts';

const filterSchema = listItemsQuerySchema.pick({ type: true, priority: true, q: true });
const keys = ['type', 'priority', 'q'] as const;

/** Filters live in the URL query (`?type=&priority=&q=`), so a shared link restores them. */
export function useItemFilters() {
  const [params, setParams] = useSearchParams();

  // An invalid value in the URL is ignored field by field, never an error page.
  const filters: ItemFilters = {};
  for (const key of keys) {
    const parsed = filterSchema.shape[key].safeParse(params.get(key) ?? undefined);
    if (parsed.success && parsed.data !== undefined) Object.assign(filters, { [key]: parsed.data });
  }

  const setFilter = useCallback(
    (key: (typeof keys)[number], value: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const clear = useCallback(
    () =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of keys) next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return { filters, setFilter, clear, active: Object.keys(filters).length > 0 };
}
