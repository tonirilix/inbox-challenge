import type { ReactNode } from 'react';
import { SkipLink } from '@/shared/a11y/skip-link';

/** Page chrome only: skip link and banner. Features mount inside and own their own landmarks. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink>Skip to items</SkipLink>
      <header className="border-b px-4 py-3">
        <p className="text-lg font-semibold">Workflow Inbox</p>
      </header>
      {children}
    </>
  );
}
