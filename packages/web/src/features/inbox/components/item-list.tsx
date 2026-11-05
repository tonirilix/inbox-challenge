import type { Status } from '@inbox/contracts';
import { LiveRegion } from '@/shared/a11y/live-region';
import { Button } from '@/shared/ui/button';
import { useItemFilters } from '../hooks/use-item-filters';
import { useItems } from '../hooks/use-items';
import { ItemRow } from './item-row';

export function ItemList({ status }: { status: Status }) {
  const { filters, clear, active } = useItemFilters();
  const { data: items, isPending, isError, refetch } = useItems(status, filters);

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
      <LiveRegion label="Results" className="text-muted-foreground mb-2 text-sm">
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </LiveRegion>
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
