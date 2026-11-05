import type { Status } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import { useItems } from '../hooks/use-items';
import { ItemRow } from './item-row';

export function ItemList({ status }: { status: Status }) {
  const { data: items, isPending, isError, refetch } = useItems(status);

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
    <ul aria-label="Items" className="divide-y rounded-md border">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
