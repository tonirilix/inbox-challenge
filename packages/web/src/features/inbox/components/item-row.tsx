import { Link, useLocation, useParams } from 'react-router';
import type { ItemEnvelope } from '@inbox/contracts';
import { cn } from '@/shared/lib/cn';
import { itemTypeLabel } from '../item-types';
import { itemLinkId } from '../utils/focus';
import { daysOverdue, overdueText } from '../utils/overdue';
import { PriorityLabel } from './priority-label';

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function ItemRow({ item }: { item: ItemEnvelope }) {
  const { view = 'pending', itemId } = useParams();
  const { search } = useLocation();
  const selected = itemId === item.id;
  const overdue = daysOverdue(item);

  return (
    <li>
      <Link
        id={itemLinkId(item.id)}
        to={`/${view}/${encodeURIComponent(item.id)}${search}`}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex flex-col gap-1 border-l-4 p-3',
          selected ? 'border-primary bg-muted' : 'border-transparent',
        )}
      >
        <span className="font-medium">{item.title}</span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-sm">
          <span>{itemTypeLabel(item.type)}</span>
          <span>{item.requester}</span>
          <PriorityLabel priority={item.priority} />
          {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
          {overdue > 0 && (
            <span className="text-destructive font-medium">{overdueText(overdue)}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
