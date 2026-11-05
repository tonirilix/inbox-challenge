import type { ExpenseItem } from '@inbox/contracts';

export function ExpenseDetail({ item }: { item: ExpenseItem }) {
  const { merchant, category, amount, currency } = item.payload;
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Merchant</dt>
      <dd>{merchant}</dd>
      <dt className="text-muted-foreground">Category</dt>
      <dd>{category}</dd>
      <dt className="text-muted-foreground">Amount</dt>
      <dd>{new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)}</dd>
    </dl>
  );
}
