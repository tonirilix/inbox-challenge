import { useEffect, useRef } from 'react';
import type { Status } from '@inbox/contracts';
import { useAnnounce } from '@/shared/a11y/announcer';
import { Button } from '@/shared/ui/button';
import { useItemFilters } from '../hooks/use-item-filters';
import { useItems } from '../hooks/use-items';
import { ItemRow } from './item-row';

const countText = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;

export function ItemList({ status }: { status: Status }) {
  const { filters, clear, active } = useItemFilters();
  const { data: items, isPending, isError, refetch } = useItems(status, filters);
  const announce = useAnnounce();

  // Announce the result count when the filters change, not on refetches or view switches.
  const filterKey = JSON.stringify(filters);
  const seen = useRef({ status, filterKey });
  useEffect(() => {
    if (!items) return;
    const filtersChanged = seen.current.status === status && seen.current.filterKey !== filterKey;
    seen.current = { status, filterKey };
    if (filtersChanged) announce(countText(items.length));
  }, [items, status, filterKey, announce]);

  if (isPending) return <p role="status">Loading items…</p>;

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-3">
        <p>Items could not be loaded.</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-2 h-5 text-sm">{countText(items.length)}</p>
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border p-4">
          <p>{active ? 'No items match your filters.' : 'No items in this view.'}</p>
          {active && (
            <Button variant="outline" size="sm" onClick={clear}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <ul aria-label="Items" className="divide-y rounded-md border">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}
