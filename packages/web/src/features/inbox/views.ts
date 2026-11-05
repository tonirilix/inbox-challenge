import type { Status } from '@inbox/contracts';

/** The sidebar views. The URL slug equals the status the view selects. */
export const views = [
  { slug: 'pending', label: 'Pending' },
  { slug: 'failed', label: 'Failed' },
  { slug: 'completed', label: 'Completed' },
] as const satisfies readonly { slug: Status; label: string }[];

export type ViewSlug = (typeof views)[number]['slug'];

export const DEFAULT_VIEW: ViewSlug = 'pending';

export const findView = (slug: string | undefined) => views.find((view) => view.slug === slug);
