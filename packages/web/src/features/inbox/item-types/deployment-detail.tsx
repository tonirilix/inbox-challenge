import type { DeploymentItem } from '@inbox/contracts';

export function DeploymentDetail({ item }: { item: DeploymentItem }) {
  const { service, environment, version } = item.payload;
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Service</dt>
      <dd>{service}</dd>
      <dt className="text-muted-foreground">Environment</dt>
      <dd>{environment}</dd>
      <dt className="text-muted-foreground">Version</dt>
      <dd>{version}</dd>
    </dl>
  );
}
