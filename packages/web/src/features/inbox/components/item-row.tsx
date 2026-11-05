import { Link, useLocation, useParams } from 'react-router';
import type { ItemEnvelope } from '@inbox/contracts';
import { cn } from '@/shared/lib/cn';
import { useCurrentView } from '../hooks/use-current-view';
import { itemTypeLabel } from '../item-types';
import { itemLinkId } from '../utils/focus';
import { capitalize, formatDate } from '../utils/format';
import { daysOverdue, overdueText } from '../utils/overdue';
import { PriorityLabel } from './priority-label';

export function ItemRow({ item }: { item: ItemEnvelope }) {
  const view = useCurrentView();
  const { itemId } = useParams();
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
          <span>{capitalize(item.status)}</span>
          {item.outcome && <span>{capitalize(item.outcome)}</span>}
          {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
          {overdue > 0 && (
            <span className="text-destructive font-medium">{overdueText(overdue)}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
