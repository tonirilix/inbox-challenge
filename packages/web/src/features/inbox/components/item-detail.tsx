import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { itemSchema, type Item, type ItemEnvelope } from '@inbox/contracts';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { useItem } from '../hooks/use-items';
import { isKnownItemType, itemTypeLabel, itemTypeModules } from '../item-types';

function BackToList() {
  const { view = 'pending' } = useParams();
  const { search } = useLocation();
  return (
    <Link to={`/${view}${search}`} className="text-sm underline">
      Back to list
    </Link>
  );
}

/** Common envelope fields around whatever the item type adds (children). */
function ItemFrame({ item, children }: { item: ItemEnvelope; children?: ReactNode }) {
  return (
    <section aria-labelledby="item-title" className="flex flex-col gap-4 rounded-md border p-4">
      <BackToList />
      <div>
        <h2 id="item-title" className="text-lg font-semibold">
          {item.title}
        </h2>
        <p className="text-muted-foreground text-sm">{itemTypeLabel(item.type)}</p>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Requester</dt>
        <dd>{item.requester}</dd>
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{item.priority}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{item.status}</dd>
        {item.dueDate && (
          <>
            <dt className="text-muted-foreground">Due</dt>
            <dd>{item.dueDate}</dd>
          </>
        )}
      </dl>
      {children}
    </section>
  );
}

function TypedDetail({ item }: { item: Item }) {
  // Correlating the item with its own module cannot be expressed by the type system.
  const { Detail } = itemTypeModules[item.type] as { Detail: ComponentType<{ item: Item }> };
  return <Detail item={item} />;
}

export function ItemDetail({ itemId }: { itemId: string }) {
  const { data: envelope, error, isPending, refetch } = useItem(itemId);

  if (isPending) return <p role="status">Loading item…</p>;

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <section aria-labelledby="item-title" className="flex flex-col gap-2">
          <h2 id="item-title" className="text-lg font-semibold">
            Item not found
          </h2>
          <p>This item does not exist or is no longer available.</p>
          <BackToList />
        </section>
      );
    }
    return (
      <div role="alert" className="flex items-center gap-3">
        <p>The item could not be loaded.</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const known = isKnownItemType(envelope.type) ? itemSchema.safeParse(envelope) : undefined;
  if (known?.success) {
    return (
      <ItemFrame item={known.data}>
        <TypedDetail item={known.data} />
      </ItemFrame>
    );
  }

  return (
    <ItemFrame item={envelope}>
      <p>Items of type “{envelope.type}” are not supported by this version of the app.</p>
    </ItemFrame>
  );
}
