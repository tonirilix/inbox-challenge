import { Link, useParams } from 'react-router';
import type { ItemEnvelope } from '@inbox/contracts';
import { itemTypeLabel } from '../item-types';

export function ItemRow({ item }: { item: ItemEnvelope }) {
  const { view = 'pending', itemId } = useParams();
  const selected = itemId === item.id;
  return (
    <li>
      <Link
        to={`/${view}/${encodeURIComponent(item.id)}`}
        aria-current={selected ? 'true' : undefined}
        className={`flex flex-col gap-1 border-l-4 p-3 ${selected ? 'border-primary bg-muted' : 'border-transparent'}`}
      >
        <span className="font-medium">{item.title}</span>
        <span className="text-muted-foreground text-sm">
          {itemTypeLabel(item.type)} · {item.requester}
        </span>
      </Link>
    </li>
  );
}
