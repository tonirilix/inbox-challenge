import type { Item } from '@inbox/contracts';
import { itemTypeModules } from '../item-types';
import { daysOverdue, overdueText } from '../utils/overdue';
import { PriorityLabel } from './priority-label';

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function ItemRow({ item }: { item: Item }) {
  const overdue = daysOverdue(item);

  return (
    <li className="flex flex-col gap-1 p-3">
      <span className="font-medium">{item.title}</span>
      <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-sm">
        <span>{itemTypeModules[item.type].label}</span>
        <span>{item.requester}</span>
        <PriorityLabel priority={item.priority} />
        {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
        {overdue > 0 && (
          <span className="text-destructive font-medium">{overdueText(overdue)}</span>
        )}
      </span>
    </li>
  );
}
