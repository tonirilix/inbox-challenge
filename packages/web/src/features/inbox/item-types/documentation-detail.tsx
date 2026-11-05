import type { DocumentationItem } from '@inbox/contracts';

export function DocumentationDetail({ item }: { item: DocumentationItem }) {
  const { topic, audience } = item.payload;
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Topic</dt>
      <dd>{topic}</dd>
      <dt className="text-muted-foreground">Audience</dt>
      <dd>{audience}</dd>
    </dl>
  );
}
