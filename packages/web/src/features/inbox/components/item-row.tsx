import type { Item } from '@inbox/contracts';
import { itemTypeModules } from '../item-types';

export function ItemRow({ item }: { item: Item }) {
  return (
    <li className="flex flex-col gap-1 p-3">
      <span className="font-medium">{item.title}</span>
      <span className="text-muted-foreground text-sm">
        {itemTypeModules[item.type].label} · {item.requester}
      </span>
    </li>
  );
}
